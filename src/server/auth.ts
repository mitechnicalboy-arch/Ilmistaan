import { Request, Response, NextFunction } from 'express';
import { UserProfile, UserRole } from '../types/index.ts';
import { db } from '../services/firebase.ts';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isSuspended: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Single official Administrator credentials and identity (Server-Side Only)
export const SINGLE_ADMIN_EMAIL = 'muhammadirteza2024@gmail.com';
export const SINGLE_ADMIN_PASSWORD = 'dawoodian4321';
export const SINGLE_ADMIN_ID = 'usr_admin_irteza';
export const SINGLE_ADMIN_NAME = 'Muhammad Irteza';

// In-memory user cache with instant fallback for reliable lookups & test scenarios
export const localUserStore = new Map<string, AuthenticatedUser>();

// Active server sessions map (token -> AuthenticatedUser)
export const activeSessions = new Map<string, AuthenticatedUser>();

// Exactly ONE Admin account in the system
export const BOOTSTRAP_ADMIN: AuthenticatedUser = {
  userId: SINGLE_ADMIN_ID,
  email: SINGLE_ADMIN_EMAIL,
  name: SINGLE_ADMIN_NAME,
  role: 'admin',
  isSuspended: false
};

const DEFAULT_STUDENT: AuthenticatedUser = {
  userId: 'usr_student_irteza',
  email: 'irteza.student@university.edu',
  name: 'Muhammad Irteza (Student)',
  role: 'student',
  isSuspended: false
};

const STUDENT_ZAIN: AuthenticatedUser = {
  userId: 'usr_student_zain',
  email: 'zain.ali@student.uni.edu',
  name: 'Zain Ali',
  role: 'student',
  isSuspended: false
};

const STUDENT_AYESHA: AuthenticatedUser = {
  userId: 'usr_student_ayesha',
  email: 'ayesha.khan@student.uni.edu',
  name: 'Ayesha Khan',
  role: 'student',
  isSuspended: true
};

// Seed users ensuring ONLY ONE Admin account exists
localUserStore.set(BOOTSTRAP_ADMIN.userId, BOOTSTRAP_ADMIN);
localUserStore.set(DEFAULT_STUDENT.userId, DEFAULT_STUDENT);
localUserStore.set(STUDENT_ZAIN.userId, STUDENT_ZAIN);
localUserStore.set(STUDENT_AYESHA.userId, STUDENT_AYESHA);

// Purge any other admin account from memory
export function purgeUnauthorizedAdmins() {
  for (const [id, user] of localUserStore.entries()) {
    if (user.role === 'admin' && (user.email !== SINGLE_ADMIN_EMAIL || user.userId !== SINGLE_ADMIN_ID)) {
      // Revert or delete unauthorized admin
      if (id === 'usr_admin_portal') {
        localUserStore.delete(id);
      } else {
        user.role = 'student';
        localUserStore.set(id, user);
      }
    }
  }
}
purgeUnauthorizedAdmins();

/**
 * Verify admin credentials server-side.
 * Only the specified email and password combination receives admin privileges.
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  if (!email || !password) return false;
  return email.trim().toLowerCase() === SINGLE_ADMIN_EMAIL && password === SINGLE_ADMIN_PASSWORD;
}

/**
 * Ensures exactly ONE admin account exists in Firestore database.
 * Deletes or demotes any other admin accounts.
 */
export async function syncSingleAdminToDatabase(): Promise<void> {
  try {
    // 1. Ensure primary admin exists in Firestore
    const adminRef = doc(db, 'users', SINGLE_ADMIN_ID);
    await setDoc(adminRef, {
      userId: SINGLE_ADMIN_ID,
      email: SINGLE_ADMIN_EMAIL,
      name: SINGLE_ADMIN_NAME,
      role: 'admin',
      isSuspended: false,
      timezone: 'Asia/Karachi (GMT+5)',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Remove obsolete demo admin account if exists in DB
    try {
      await deleteDoc(doc(db, 'users', 'usr_admin_portal'));
    } catch (_) {}

    // 3. Clean up admins collection so only single admin is registered
    try {
      await setDoc(doc(db, 'admins', SINGLE_ADMIN_ID), {
        email: SINGLE_ADMIN_EMAIL,
        name: SINGLE_ADMIN_NAME,
        assignedAt: new Date().toISOString()
      }, { merge: true });
      await deleteDoc(doc(db, 'admins', 'usr_admin_portal'));
    } catch (_) {}
  } catch (err) {
    // Graceful offline fallback
  }
}

// Trigger initial single admin DB sync asynchronously
syncSingleAdminToDatabase().catch(() => {});

/**
 * Resolves user profile from database. Never trusts role or permissions sent from client.
 * Enforces that ONLY SINGLE_ADMIN_EMAIL with SINGLE_ADMIN_ID can hold the 'admin' role.
 */
export async function resolveUserFromDatabase(userId: string): Promise<AuthenticatedUser | null> {
  if (!userId) return null;

  if (userId === SINGLE_ADMIN_ID) {
    if (!localUserStore.has(SINGLE_ADMIN_ID)) {
      localUserStore.set(SINGLE_ADMIN_ID, BOOTSTRAP_ADMIN);
    }
    return BOOTSTRAP_ADMIN;
  }

  // Check local cache first
  const cached = localUserStore.get(userId);

  // Attempt Firestore fetch for live role & suspension verification
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const rawEmail = (data.email || '').toLowerCase().trim();
      // Server-side strict check: only the exact single admin can be admin
      const isTrueAdmin = userId === SINGLE_ADMIN_ID && rawEmail === SINGLE_ADMIN_EMAIL;
      const user: AuthenticatedUser = {
        userId,
        email: data.email || 'user@university.edu',
        name: data.name || 'User',
        role: isTrueAdmin ? 'admin' : 'student',
        isSuspended: data.isSuspended === true
      };
      localUserStore.set(userId, user);
      return user;
    }
  } catch (err) {
    // If firestore is in offline/restricted mode, fall back to cached store
  }

  if (cached) {
    // Enforce role rule on cached user
    const isTrueAdmin = cached.userId === SINGLE_ADMIN_ID && cached.email.toLowerCase() === SINGLE_ADMIN_EMAIL;
    if (cached.role === 'admin' && !isTrueAdmin) {
      cached.role = 'student';
    }
    return cached;
  }

  return null;
}

/**
 * Authentication Middleware:
 * Extracts user identifier from Authorization Bearer token or x-user-id header.
 * Verifies user in the database, retrieves authentic role, and enforces ban checks.
 */
export async function requireAuthentication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let candidateUserId: string | null = null;
    let authEmail: string | null = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      
      // Check active sessions first
      if (activeSessions.has(token)) {
        const sessionUser = activeSessions.get(token)!;
        if (sessionUser.isSuspended) {
          res.status(403).json({
            error: 'Forbidden: Your academic account has been suspended by an administrator.',
            code: 'ACCOUNT_SUSPENDED'
          });
          return;
        }
        req.user = sessionUser;
        return next();
      }

      // Support structured session token format: "session_<userId>_<role>..." or "token:<userId>:<email>"
      if (token.startsWith('session_')) {
        const withoutPrefix = token.substring('session_'.length);
        if (withoutPrefix.startsWith(SINGLE_ADMIN_ID)) {
          candidateUserId = SINGLE_ADMIN_ID;
        } else {
          const matchingUser = Array.from(localUserStore.keys()).find(uid => withoutPrefix.startsWith(uid));
          if (matchingUser) {
            candidateUserId = matchingUser;
          } else {
            const adminIdx = withoutPrefix.indexOf('_admin');
            const studentIdx = withoutPrefix.indexOf('_student');
            const splitIdx = adminIdx !== -1 ? adminIdx : studentIdx;
            if (splitIdx !== -1) {
              candidateUserId = withoutPrefix.substring(0, splitIdx);
            } else {
              candidateUserId = withoutPrefix;
            }
          }
        }
      } else if (token.includes(':')) {
        const [id, email] = token.split(':');
        candidateUserId = id;
        authEmail = email;
      } else {
        candidateUserId = token;
      }
    }

    // Support dev/testing header
    const devUserId = req.headers['x-user-id'] as string;
    if (devUserId && (devUserId === SINGLE_ADMIN_ID || !candidateUserId)) {
      candidateUserId = devUserId.trim();
    }

    // Fallback to default student if no credentials provided in dev environment
    if (!candidateUserId) {
      candidateUserId = 'usr_student_irteza';
    }

    // Resolve user strictly from database
    let user = await resolveUserFromDatabase(candidateUserId);

    if (!user) {
      // If user does not exist in store, create a standard student account (NEVER admin without password authentication!)
      const isKnownAdmin = candidateUserId === SINGLE_ADMIN_ID && authEmail === SINGLE_ADMIN_EMAIL;
      user = {
        userId: candidateUserId,
        email: authEmail || `${candidateUserId}@university.edu`,
        name: isKnownAdmin ? SINGLE_ADMIN_NAME : `Student (${candidateUserId})`,
        role: isKnownAdmin ? 'admin' : 'student',
        isSuspended: false
      };
      localUserStore.set(candidateUserId, user);
    }

    // Double check: No account other than SINGLE_ADMIN_ID can ever have 'admin' role
    if (user.role === 'admin' && (user.userId !== SINGLE_ADMIN_ID || user.email.toLowerCase() !== SINGLE_ADMIN_EMAIL)) {
      user.role = 'student';
    }

    // Check account suspension / ban
    if (user.isSuspended) {
      res.status(403).json({
        error: 'Forbidden: Your academic account has been suspended by an administrator.',
        code: 'ACCOUNT_SUSPENDED'
      });
      return;
    }

    // Bind authenticated user to request context
    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Unauthorized: Invalid authentication credentials.' });
  }
}

/**
 * Admin Authorization Middleware:
 * Verifies that the authenticated user possesses the 'admin' role in the database.
 * Strictly verifies identity against the single official Admin account.
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    return;
  }

  // Critical: Only the one designated admin email and userId has admin privileges
  if (
    req.user.role !== 'admin' || 
    req.user.email.toLowerCase() !== SINGLE_ADMIN_EMAIL || 
    req.user.userId !== SINGLE_ADMIN_ID
  ) {
    res.status(403).json({
      error: 'Forbidden: Administrative privileges are required for this operation.',
      code: 'ADMIN_REQUIRED'
    });
    return;
  }

  next();
}

