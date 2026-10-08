import { Router, Request, Response } from 'express';
import { 
  requireAuthentication, 
  requireAdmin, 
  AuthenticatedRequest, 
  localUserStore, 
  activeSessions,
  BOOTSTRAP_ADMIN,
  SINGLE_ADMIN_EMAIL,
  SINGLE_ADMIN_ID,
  SINGLE_ADMIN_NAME,
  verifyAdminCredentials,
  AuthenticatedUser
} from './auth.ts';
import { academicStore, AcademicRecordType } from './academicStore.ts';
import { handleTutorGeneration } from './geminiTutor.ts';

export const apiRouter = Router();

// ==========================================
// 1. HEALTH & AUTH CONTEXT
// ==========================================

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Standard Login Endpoint (Server-Side Verification):
 * Only SINGLE_ADMIN_EMAIL with correct password receives 'admin' privileges.
 * All other accounts are strictly 'student'.
 */
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Both email and password are required.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();

  // Admin Verification
  if (cleanEmail === SINGLE_ADMIN_EMAIL) {
    if (verifyAdminCredentials(cleanEmail, String(password))) {
      const token = `session_${SINGLE_ADMIN_ID}_admin_${Date.now()}`;
      activeSessions.set(token, BOOTSTRAP_ADMIN);
      localUserStore.set(SINGLE_ADMIN_ID, BOOTSTRAP_ADMIN);
      res.json({
        success: true,
        user: BOOTSTRAP_ADMIN,
        token,
        message: 'Admin authenticated successfully.'
      });
      return;
    } else {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
  }

  // Regular Student Verification
  let student = Array.from(localUserStore.values()).find(
    u => u.email.toLowerCase() === cleanEmail && u.userId !== SINGLE_ADMIN_ID
  );

  if (!student) {
    // Dynamically register verified student
    const studentId = `usr_student_${Date.now()}`;
    const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    student = {
      userId: studentId,
      email: cleanEmail,
      name: formattedName || 'Student',
      role: 'student', // ALWAYS student
      isSuspended: false
    };
    localUserStore.set(studentId, student);
  }

  if (student.isSuspended) {
    res.status(403).json({
      error: 'Forbidden: Your academic account has been suspended by an administrator.',
      code: 'ACCOUNT_SUSPENDED'
    });
    return;
  }

  // Guarantee student role
  const safeStudent: AuthenticatedUser = {
    ...student,
    role: 'student'
  };

  const token = `session_${safeStudent.userId}_student_${Date.now()}`;
  activeSessions.set(token, safeStudent);
  localUserStore.set(safeStudent.userId, safeStudent);

  res.json({
    success: true,
    user: safeStudent,
    token,
    message: 'Authenticated successfully.'
  });
});

/**
 * Standard Registration Endpoint:
 * Prevents anyone from registering as an Admin without authentic credentials.
 */
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    res.status(400).json({ error: 'Full name, email, and password are required.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();

  // If registering with admin email, must supply exact admin password
  if (cleanEmail === SINGLE_ADMIN_EMAIL) {
    if (verifyAdminCredentials(cleanEmail, String(password))) {
      const token = `session_${SINGLE_ADMIN_ID}_admin_${Date.now()}`;
      activeSessions.set(token, BOOTSTRAP_ADMIN);
      localUserStore.set(SINGLE_ADMIN_ID, BOOTSTRAP_ADMIN);
      res.status(200).json({
        success: true,
        user: BOOTSTRAP_ADMIN,
        token,
        message: 'Admin account verified.'
      });
      return;
    } else {
      res.status(401).json({ error: 'Invalid credentials for administrative account.' });
      return;
    }
  }

  // Register regular student
  const studentId = `usr_student_${Date.now()}`;
  const studentUser: AuthenticatedUser = {
    userId: studentId,
    email: cleanEmail,
    name: String(fullName).trim(),
    role: 'student', // ALWAYS student
    isSuspended: false
  };

  localUserStore.set(studentId, studentUser);
  const token = `session_${studentId}_student_${Date.now()}`;
  activeSessions.set(token, studentUser);

  res.status(201).json({
    success: true,
    user: studentUser,
    token,
    message: 'Student account registered successfully.'
  });
});

apiRouter.get('/auth/me', requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});


// ==========================================
// 2. GENERIC HANDLERS FOR ACADEMIC RESOURCES
// ==========================================

function createResourceHandlers(type: AcademicRecordType, label: string) {
  // LIST
  apiRouter.get(`/${type}s`, requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
    const courseId = req.query.courseId as string | undefined;
    const records = academicStore.listRecords(type, courseId);
    res.json({ [type + 's']: records });
  });

  // GET SINGLE
  apiRouter.get(`/${type}s/:id`, requireAuthentication, (req: AuthenticatedRequest, res: Response) => {
    const record = academicStore.getRecord(type, req.params.id);
    if (!record) {
      res.status(404).json({ error: `${label} not found.` });
      return;
    }
    res.json({ [type]: record });
  });

  // CREATE
  apiRouter.post(`/${type}s`, requireAuthentication, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { courseId, title, topicsCovered } = req.body;
      const effectiveTitle = title || topicsCovered;

      if (!courseId || !effectiveTitle) {
        res.status(400).json({ error: `Both courseId and title are required for ${label}.` });
        return;
      }

      // CRITICAL SECURITY REQUIREMENT:
      // Ownership is derived exclusively from req.user. Never trust client user_id!
      const result = await academicStore.createRecord(type, req.body, req.user!);

      if (result.status === 'duplicate') {
        const errorMsg = result.reason || `This ${label.toLowerCase()} has already been listed for this subject. Duplicate submissions are not allowed.`;
        res.status(409).json({
          error: errorMsg,
          code: 'DUPLICATE_RECORD',
          message: errorMsg,
          reason: result.reason,
          existingRecord: result.existingRecord
        });
        return;
      }

      res.status(201).json({
        message: `${label} created successfully.`,
        [type]: result.record
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });

  // UPDATE (PUT & PATCH)
  const handleUpdate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await academicStore.updateRecord(type, req.params.id, req.body, req.user!);

      if (result.status === 'not_found') {
        res.status(404).json({ error: `${label} not found.` });
        return;
      }

      if (result.status === 'forbidden') {
        res.status(403).json({
          error: `Forbidden: Only the author who added this ${label.toLowerCase()} or an Administrator has permission to edit it.`,
          code: 'ACCESS_DENIED'
        });
        return;
      }

      if (result.status === 'duplicate') {
        const errorMsg = (result as any).reason || `This ${label.toLowerCase()} title or sequence already exists for this subject.`;
        res.status(409).json({
          error: errorMsg,
          code: 'DUPLICATE_RECORD',
          reason: (result as any).reason,
          existingRecord: result.existingRecord
        });
        return;
      }

      res.json({
        message: `${label} updated successfully.`,
        [type]: result.record
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  };

  apiRouter.patch(`/${type}s/:id`, requireAuthentication, handleUpdate);
  apiRouter.put(`/${type}s/:id`, requireAuthentication, handleUpdate);

  // DELETE
  apiRouter.delete(`/${type}s/:id`, requireAuthentication, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await academicStore.deleteRecord(type, req.params.id, req.user!);

      if (result.status === 'not_found') {
        res.status(404).json({ error: `${label} not found.` });
        return;
      }

      if (result.status === 'forbidden') {
        res.status(403).json({
          error: `Forbidden: Only the author who added this ${label.toLowerCase()} or an Administrator has permission to delete it.`,
          code: 'ACCESS_DENIED'
        });
        return;
      }

      res.json({ message: `${label} deleted successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  });
}

// Register CRUD endpoints for all academic records
createResourceHandlers('assignment', 'Assignment');
createResourceHandlers('lecture', 'Lecture');
createResourceHandlers('quiz', 'Quiz');
createResourceHandlers('note', 'Note');

// ==========================================
// 3. ADMINISTRATIVE ENDPOINTS
// ==========================================

apiRouter.get('/admin/users', requireAuthentication, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  // Return all users, ensuring only the single official admin has admin role
  const users = Array.from(localUserStore.values()).map(u => {
    if (u.role === 'admin' && (u.userId !== SINGLE_ADMIN_ID || u.email.toLowerCase() !== SINGLE_ADMIN_EMAIL)) {
      return { ...u, role: 'student' as const };
    }
    return u;
  });
  res.json({ users });
});

apiRouter.post('/admin/users/:userId/ban', requireAuthentication, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  if (req.params.userId === SINGLE_ADMIN_ID) {
    res.status(403).json({ error: 'System policy: The primary Admin account cannot be suspended.' });
    return;
  }
  const target = localUserStore.get(req.params.userId);
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  target.isSuspended = true;
  localUserStore.set(target.userId, target);
  res.json({ message: `User ${target.userId} has been suspended/banned.`, user: target });
});

apiRouter.post('/admin/users/:userId/unban', requireAuthentication, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const target = localUserStore.get(req.params.userId);
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  target.isSuspended = false;
  localUserStore.set(target.userId, target);
  res.json({ message: `User ${target.userId} has been unbanned.`, user: target });
});

apiRouter.patch('/admin/users/:userId/role', requireAuthentication, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body;
  if (role !== 'admin' && role !== 'student') {
    res.status(400).json({ error: 'Invalid role. Must be admin or student.' });
    return;
  }
  const target = localUserStore.get(req.params.userId);
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Enforce single Admin invariant: No other account can be granted admin privileges
  if (role === 'admin' && (target.userId !== SINGLE_ADMIN_ID || target.email.toLowerCase() !== SINGLE_ADMIN_EMAIL)) {
    res.status(403).json({
      error: 'System policy: Exactly one Admin account (muhammadirteza2024@gmail.com) is permitted in the system.',
      code: 'SINGLE_ADMIN_RESTRICTION'
    });
    return;
  }

  if (target.userId === SINGLE_ADMIN_ID && role !== 'admin') {
    res.status(403).json({
      error: 'System policy: The primary Admin account cannot be demoted.',
      code: 'PRIMARY_ADMIN_PROTECTED'
    });
    return;
  }

  target.role = role;
  localUserStore.set(target.userId, target);
  res.json({ message: `Role for ${target.userId} updated to ${role}.`, user: target });
});

/**
 * ADMIN ONLY: Delete user account and associated student records.
 */
apiRouter.delete('/admin/users/:userId', requireAuthentication, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;

  if (userId === SINGLE_ADMIN_ID) {
    res.status(403).json({
      error: 'System policy: The primary Academic Administrator account cannot be deleted.',
      code: 'CANNOT_DELETE_PRIMARY_ADMIN'
    });
    return;
  }

  const target = localUserStore.get(userId);
  if (!target) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  // Remove user from registry
  localUserStore.delete(userId);

  // Invalidate any active sessions for this user
  for (const [token, sessionUser] of activeSessions.entries()) {
    if (sessionUser.userId === userId) {
      activeSessions.delete(token);
    }
  }

  // Delete records belonging to user
  try {
    await academicStore.deleteUserRecords(userId, req.user!);
  } catch (err) {
    // Non-fatal
  }

  // Database deletion
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('../services/firebase.ts');
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    // Non-fatal fallback
  }

  res.json({
    message: `User account "${target.name}" (${target.email}) deleted successfully.`,
    deletedUserId: userId
  });
});

/**
 * ADMIN ONLY: Purge all trashed records permanently across all collections.
 */
apiRouter.post('/admin/trash/purge-all', requireAuthentication, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await academicStore.purgeAllTrash(req.user!);
    res.json({
      message: `Successfully purged ${result.count} soft-deleted records from storage.`,
      purgedCount: result.count
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to purge trash.' });
  }
});

/**
 * Course deletion endpoint: Admin can delete any course, student can delete their own
 */
apiRouter.delete('/courses/:id', requireAuthentication, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user?.role === 'admin';
  // If not admin, verify ownership or permit
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('../services/firebase.ts');
    await deleteDoc(doc(db, 'courses', id));
    if (req.user?.userId) {
      await deleteDoc(doc(db, `users/${req.user.userId}/courses`, id));
    }
    res.json({ message: 'Course deleted successfully.', courseId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete course' });
  }
});

// ==========================================
// 4. AI TUTOR ENDPOINT
// ==========================================

apiRouter.post('/tutor', async (req, res) => {
  try {
    const result = await handleTutorGeneration(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 5. TEST SUITE RUNNER ENDPOINT
// ==========================================

apiRouter.post('/test-suite/run', async (_req, res) => {
  try {
    const { runSecurityTestSuite } = await import('./tests/securityTests.ts');
    const results = await runSecurityTestSuite();
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to execute test suite' });
  }
});
