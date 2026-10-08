import { Assignment, Lecture, Quiz, AcademicNote } from '../types/index.ts';
import { 
  normalizeTitle, 
  generateUniqueKey, 
  areAcademicRecordsDuplicate,
  AcademicRecordCheckPayload
} from './normalization.ts';
import { AuthenticatedUser } from './auth.ts';
import { INITIAL_ASSIGNMENTS, INITIAL_LECTURES, INITIAL_QUIZZES } from '../data/initialData.ts';
import { db } from '../services/firebase.ts';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export type AcademicRecordType = 'assignment' | 'lecture' | 'quiz' | 'note';

export interface AcademicRecordBase {
  id: string;
  userId: string;
  courseId: string;
  semesterId?: string;
  title: string;
  normalizedTitle: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  [key: string]: any;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRecord?: AcademicRecordBase;
  reason?: string;
}

// In-memory atomic registry with database write-through
class AcademicStore {
  private assignments = new Map<string, Assignment>();
  private lectures = new Map<string, Lecture>();
  private quizzes = new Map<string, Quiz>();
  private notes = new Map<string, AcademicNote>();

  // Atomic unique keys lock table: lockKey -> recordId
  private uniqueLocks = new Map<string, string>();

  // Mutex per uniqueKey to prevent race conditions during simultaneous requests
  private pendingLocks = new Map<string, Promise<any>>();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed initial assignments
    INITIAL_ASSIGNMENTS.forEach((a, idx) => {
      const id = a.id || `assign_seed_${idx + 1}`;
      const norm = normalizeTitle(a.title);
      const record: Assignment = {
        ...a,
        id,
        userId: 'usr_student_irteza',
        assignmentNumber: a.assignmentNumber || (idx + 1),
        isPinned: a.isPinned ?? false,
        isDeleted: false,
        createdAt: a.createdAt || new Date('2026-09-02T09:00:00Z').toISOString(),
      };
      (record as any).normalizedTitle = norm;
      this.assignments.set(id, record);
      const lockKey = generateUniqueKey('assignment', record.courseId, norm);
      this.uniqueLocks.set(lockKey, id);
    });

    // Seed initial lectures
    INITIAL_LECTURES.forEach((l, idx) => {
      const id = l.id || `lec_seed_${idx + 1}`;
      const title = l.title || l.topicsCovered;
      const norm = normalizeTitle(title);
      const record: Lecture = {
        ...l,
        id,
        userId: 'usr_student_irteza',
        title,
        lectureNumber: l.lectureNumber || (idx + 1),
        isPinned: l.isPinned ?? false,
        isDeleted: false,
        createdAt: l.createdAt || new Date('2026-09-02T09:00:00Z').toISOString(),
      };
      (record as any).normalizedTitle = norm;
      this.lectures.set(id, record);
      const lockKey = generateUniqueKey('lecture', record.courseId, norm);
      this.uniqueLocks.set(lockKey, id);
    });

    // Seed initial quizzes
    INITIAL_QUIZZES.forEach((q, idx) => {
      const id = q.id || `quiz_seed_${idx + 1}`;
      const norm = normalizeTitle(q.title);
      const record: Quiz = {
        ...q,
        id,
        userId: 'usr_student_irteza',
        quizNumber: q.quizNumber || (idx + 1),
        isPinned: q.isPinned ?? false,
        isDeleted: false,
        createdAt: q.createdAt || new Date('2026-09-02T09:00:00Z').toISOString(),
      };
      (record as any).normalizedTitle = norm;
      this.quizzes.set(id, record);
      const lockKey = generateUniqueKey('quiz', record.courseId, norm);
      this.uniqueLocks.set(lockKey, id);
    });
  }

  private getCollection(type: AcademicRecordType): Map<string, any> {
    switch (type) {
      case 'assignment':
        return this.assignments;
      case 'lecture':
        return this.lectures;
      case 'quiz':
        return this.quizzes;
      case 'note':
        return this.notes;
    }
  }

  /**
   * Acquire atomic lock on a unique composite key to prevent race conditions.
   * If two requests attempt to create the same key concurrently, one waits and
   * then receives duplicate conflict.
   */
  private async acquireKeyLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    while (this.pendingLocks.has(key)) {
      try {
        await this.pendingLocks.get(key);
      } catch (err) {
        // continue
      }
    }

    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.pendingLocks.set(key, lockPromise);

    try {
      return await operation();
    } finally {
      this.pendingLocks.delete(key);
      releaseLock();
    }
  }

  /**
   * Check for duplicate record by course, normalized title, sequence number, and semantic similarity.
   * Prevents any user from re-listing an already-added assignment, lecture, or quiz.
   */
  public checkDuplicate(
    type: AcademicRecordType,
    courseId: string,
    candidateData: any,
    excludeId?: string
  ): DuplicateCheckResult {
    const title = typeof candidateData === 'string' 
      ? candidateData 
      : (candidateData?.title || candidateData?.topicsCovered || '');
    const norm = normalizeTitle(title);
    const key = generateUniqueKey(type, courseId, norm);
    const existingId = this.uniqueLocks.get(key);

    const collection = this.getCollection(type);

    if (existingId && existingId !== excludeId) {
      const existing = collection.get(existingId);
      if (existing && !existing.isDeleted) {
        return { 
          isDuplicate: true, 
          existingRecord: existing,
          reason: `An exact ${type} ("${existing.title}") is already listed for this subject.`
        };
      }
    }

    // Check all active records for this course using the duplicate prevention algorithm
    const candidatePayload: AcademicRecordCheckPayload = {
      type,
      courseId,
      title,
      topicsCovered: typeof candidateData === 'object' ? candidateData?.topicsCovered : undefined,
      number: typeof candidateData === 'object' 
        ? (candidateData?.assignmentNumber || candidateData?.lectureNumber || candidateData?.quizNumber) 
        : undefined,
      date: typeof candidateData === 'object' ? candidateData?.date : undefined,
      deadline: typeof candidateData === 'object' ? candidateData?.deadline : undefined
    };

    for (const record of collection.values()) {
      if (record.isDeleted || record.courseId !== courseId || record.id === excludeId) continue;
      
      const existingPayload: AcademicRecordCheckPayload = {
        type,
        courseId,
        title: record.title,
        topicsCovered: record.topicsCovered,
        number: record.assignmentNumber || record.lectureNumber || record.quizNumber,
        date: record.date,
        deadline: record.deadline
      };

      const dupCheck = areAcademicRecordsDuplicate(candidatePayload, existingPayload);
      if (dupCheck.isDuplicate) {
        return {
          isDuplicate: true,
          existingRecord: record,
          reason: dupCheck.reason || `This ${type} already exists for this subject.`
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * CREATE:
   * 1. Derives ownership exclusively from authenticated user session.
   * 2. Checks global duplicate across all users using duplicate prevention algorithm.
   * 3. Prevents race conditions via atomic transaction locking.
   */
  public async createRecord(
    type: AcademicRecordType,
    data: any,
    user: AuthenticatedUser
  ): Promise<{ status: 'created'; record: any } | { status: 'duplicate'; existingRecord: any; reason?: string }> {
    const title = data.title || data.topicsCovered || '';
    const norm = normalizeTitle(title);
    const courseId = data.courseId;
    const lockKey = generateUniqueKey(type, courseId, norm);

    return await this.acquireKeyLock(lockKey, async () => {
      // Step 1: Check duplicate within atomic lock
      const dup = this.checkDuplicate(type, courseId, data);
      if (dup.isDuplicate) {
        return { status: 'duplicate', existingRecord: dup.existingRecord, reason: dup.reason };
      }

      // Step 2: Generate unique record ID
      const recordId = data.id || `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Step 3: Enforce ownership strictly from authenticated user.
      // NEVER accept user_id or userId from the client payload!
      const now = new Date().toISOString();
      const record: AcademicRecordBase = {
        ...data,
        id: recordId,
        userId: user.userId, // Authenticated owner
        courseId,
        title,
        normalizedTitle: norm,
        isPinned: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };

      // Remove any injected role/client-tampered properties
      delete (record as any).user_id;

      // Step 4: Register atomic unique key lock
      this.uniqueLocks.set(lockKey, recordId);

      // Step 5: Save to collection
      const collection = this.getCollection(type);
      collection.set(recordId, record);

      // Step 6: Write-through to database in background
      try {
        await setDoc(doc(db, `${type}s`, recordId), record, { merge: true });
        await setDoc(doc(db, 'unique_locks', lockKey), {
          recordId,
          type,
          courseId,
          normalizedTitle: norm,
          createdAt: now,
        });
      } catch (err) {
        // Log gracefully; local transactional memory ensures safety
      }

      return { status: 'created', record };
    });
  }

  /**
   * READ:
   * Retrieves single record.
   */
  public getRecord(type: AcademicRecordType, id: string): AcademicRecordBase | null {
    const collection = this.getCollection(type);
    const record = collection.get(id);
    if (!record || record.isDeleted) return null;
    return record;
  }

  /**
   * LIST:
   * Lists records for a course or all records.
   */
  public listRecords(type: AcademicRecordType, courseId?: string): AcademicRecordBase[] {
    const collection = this.getCollection(type);
    const all = Array.from(collection.values()).filter((r: any) => !r.isDeleted);
    if (courseId) {
      return all.filter((r: any) => r.courseId === courseId);
    }
    return all;
  }

  /**
   * UPDATE:
   * 1. Verifies ownership: record.userId === user.userId OR user.role === 'admin'.
   * 2. Rejects with 403 Forbidden if not authorized.
   * 3. Prevents changing user_id or owner.
   * 4. Enforces duplicate prevention if title changes.
   */
  public async updateRecord(
    type: AcademicRecordType,
    id: string,
    updates: any,
    user: AuthenticatedUser
  ): Promise<
    | { status: 'updated'; record: any }
    | { status: 'forbidden' }
    | { status: 'not_found' }
    | { status: 'duplicate'; existingRecord: any }
  > {
    const collection = this.getCollection(type);
    const existing = collection.get(id);

    if (!existing || existing.isDeleted) {
      return { status: 'not_found' };
    }

    // CRITICAL: Ownership & Role authorization
    const isOwner = existing.userId === user.userId;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return { status: 'forbidden' };
    }

    // Check title duplication if title is being changed
    const newTitle = updates.title !== undefined ? updates.title : existing.title;
    const newNorm = normalizeTitle(newTitle);
    const targetCourseId = updates.courseId || existing.courseId;
    const oldLockKey = generateUniqueKey(type, existing.courseId, existing.normalizedTitle || normalizeTitle(existing.title));
    const newLockKey = generateUniqueKey(type, targetCourseId, newNorm);

    return await this.acquireKeyLock(newLockKey, async () => {
      if (newLockKey !== oldLockKey || updates.assignmentNumber || updates.lectureNumber || updates.quizNumber || updates.date || updates.deadline) {
        const dup = this.checkDuplicate(type, targetCourseId, { ...existing, ...updates, title: newTitle }, id);
        if (dup.isDuplicate) {
          return { status: 'duplicate', existingRecord: dup.existingRecord, reason: dup.reason };
        }
      }

      // Safeguard: Never allow changing ownership fields via updates
      const safeUpdates = { ...updates };
      delete safeUpdates.id;
      delete safeUpdates.userId;
      delete safeUpdates.user_id;
      delete safeUpdates.createdAt;
      delete safeUpdates.owner;

      const updatedRecord: AcademicRecordBase = {
        ...existing,
        ...safeUpdates,
        title: newTitle,
        normalizedTitle: newNorm,
        updatedAt: new Date().toISOString(),
      };

      // Update unique lock table if title changed
      if (newLockKey !== oldLockKey) {
        this.uniqueLocks.delete(oldLockKey);
        this.uniqueLocks.set(newLockKey, id);
      }

      collection.set(id, updatedRecord);

      // Database sync
      try {
        await setDoc(doc(db, `${type}s`, id), updatedRecord, { merge: true });
        if (newLockKey !== oldLockKey) {
          await deleteDoc(doc(db, 'unique_locks', oldLockKey));
          await setDoc(doc(db, 'unique_locks', newLockKey), {
            recordId: id,
            type,
            courseId: targetCourseId,
            normalizedTitle: newNorm,
            updatedAt: updatedRecord.updatedAt,
          });
        }
      } catch (err) {
        // Safe fallback
      }

      return { status: 'updated', record: updatedRecord };
    });
  }

  /**
   * DELETE:
   * 1. Verifies ownership: record.userId === user.userId OR user.role === 'admin'.
   * 2. Rejects with 403 Forbidden if not authorized.
   * 3. Releases unique key lock upon deletion.
   */
  public async deleteRecord(
    type: AcademicRecordType,
    id: string,
    user: AuthenticatedUser,
    permanent: boolean = false
  ): Promise<{ status: 'deleted' } | { status: 'forbidden' } | { status: 'not_found' }> {
    const collection = this.getCollection(type);
    const existing = collection.get(id);

    if (!existing) {
      if (user.role === 'admin') {
        try {
          await deleteDoc(doc(db, `${type}s`, id));
        } catch (err) {
          // ignore error
        }
        return { status: 'deleted' };
      }
      return { status: 'not_found' };
    }

    // CRITICAL: Ownership & Role authorization
    const isOwner = existing.userId === user.userId;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return { status: 'forbidden' };
    }

    // Release lock
    const norm = existing.normalizedTitle || normalizeTitle(existing.title);
    const lockKey = generateUniqueKey(type, existing.courseId, norm);
    this.uniqueLocks.delete(lockKey);

    // If permanent wipe or already soft-deleted, purge from storage map
    if (permanent || existing.isDeleted) {
      existing.isDeleted = true;
      collection.delete(id);
    } else {
      existing.isDeleted = true;
    }

    // Database sync
    try {
      await deleteDoc(doc(db, `${type}s`, id));
      await deleteDoc(doc(db, 'unique_locks', lockKey));
    } catch (err) {
      // Safe fallback
    }

    return { status: 'deleted' };
  }

  /**
   * ADMIN ONLY: Purge all trashed / soft-deleted records across all collections permanently.
   */
  public async purgeAllTrash(
    user: AuthenticatedUser
  ): Promise<{ status: 'purged' | 'forbidden'; count: number }> {
    if (user.role !== 'admin') {
      return { status: 'forbidden', count: 0 };
    }

    let purgedCount = 0;
    const types: AcademicRecordType[] = ['assignment', 'lecture', 'quiz', 'note'];

    for (const t of types) {
      const collection = this.getCollection(t);
      for (const [id, rec] of collection.entries()) {
        if (rec.isDeleted) {
          const norm = rec.normalizedTitle || normalizeTitle(rec.title);
          const lockKey = generateUniqueKey(t, rec.courseId, norm);
          this.uniqueLocks.delete(lockKey);
          collection.delete(id);
          purgedCount++;

          try {
            await deleteDoc(doc(db, `${t}s`, id));
            await deleteDoc(doc(db, 'unique_locks', lockKey));
          } catch (e) {
            // ignore
          }
        }
      }
    }

    return { status: 'purged', count: purgedCount };
  }

  /**
   * ADMIN ONLY: Delete all records belonging to a user when user is deleted.
   */
  public async deleteUserRecords(
    userId: string,
    user: AuthenticatedUser
  ): Promise<{ deletedCount: number }> {
    if (user.role !== 'admin') {
      throw new Error('Forbidden: Only admin can delete user records');
    }

    let deletedCount = 0;
    const types: AcademicRecordType[] = ['assignment', 'lecture', 'quiz', 'note'];

    for (const t of types) {
      const collection = this.getCollection(t);
      for (const [id, rec] of collection.entries()) {
        if (rec.userId === userId) {
          const norm = rec.normalizedTitle || normalizeTitle(rec.title);
          const lockKey = generateUniqueKey(t, rec.courseId, norm);
          this.uniqueLocks.delete(lockKey);
          collection.delete(id);
          deletedCount++;

          try {
            await deleteDoc(doc(db, `${t}s`, id));
            await deleteDoc(doc(db, 'unique_locks', lockKey));
          } catch (e) {}
        }
      }
    }

    return { deletedCount };
  }

  /**
   * Reset store (useful for automated security test suites)
   */
  public reset() {
    this.assignments.clear();
    this.lectures.clear();
    this.quizzes.clear();
    this.notes.clear();
    this.uniqueLocks.clear();
    this.seedInitialData();
  }
}

export const academicStore = new AcademicStore();
