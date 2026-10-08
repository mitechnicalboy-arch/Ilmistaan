import { academicStore } from '../academicStore.ts';
import { AuthenticatedUser, localUserStore } from '../auth.ts';

export interface TestResult {
  id: string;
  name: string;
  expectedStatus: number | string;
  actualStatus: number | string;
  passed: boolean;
  details?: string;
}

export interface SecuritySuiteReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
}

export async function runSecurityTestSuite(): Promise<SecuritySuiteReport> {
  academicStore.reset();

  const userA: AuthenticatedUser = {
    userId: 'user_42_alice',
    email: 'alice@university.edu',
    name: 'Student Alice',
    role: 'student',
    isSuspended: false,
  };

  const userB: AuthenticatedUser = {
    userId: 'user_99_bob',
    email: 'bob@university.edu',
    name: 'Student Bob',
    role: 'student',
    isSuspended: false,
  };

  const adminUser: AuthenticatedUser = {
    userId: 'usr_admin_irteza',
    email: 'muhammadirteza2024@gmail.com',
    name: 'Muhammad Irteza (Admin)',
    role: 'admin',
    isSuspended: false,
  };

  localUserStore.set(userA.userId, userA);
  localUserStore.set(userB.userId, userB);
  localUserStore.set(adminUser.userId, adminUser);

  const results: TestResult[] = [];

  // =========================================================================
  // SETUP: Create base items
  // =========================================================================
  const aRes = await academicStore.createRecord(
    'assignment',
    {
      courseId: 'course_cs101_th',
      title: 'Lab 03 – Loop Construction',
      description: 'Practice while and for loops in C',
      deadline: '2026-10-15',
    },
    userA
  );
  const userAAssignId = (aRes as any).record.id;

  const bRes = await academicStore.createRecord(
    'assignment',
    {
      courseId: 'course_cs101_th',
      title: 'Lab 04 – Array Traversals',
      description: 'Matrix multiplication problem',
      deadline: '2026-10-22',
    },
    userB
  );
  const userBAssignId = (bRes as any).record.id;

  const bLec = await academicStore.createRecord(
    'lecture',
    {
      courseId: 'course_cs101_th',
      title: 'Functions & Pass by Reference',
      topicsCovered: 'Pointers and functions',
      date: '2026-10-05',
    },
    userB
  );
  const userBLectureId = (bLec as any).record.id;

  const bQuiz = await academicStore.createRecord(
    'quiz',
    {
      courseId: 'course_cs101_th',
      title: 'PF Quiz 02: Pointers and Memory',
      venue: 'C6',
      totalMarks: 15,
      date: '2026-10-18',
    },
    userB
  );
  const userBQuizId = (bQuiz as any).record.id;

  // =========================================================================
  // TEST 1: User A edits User A's assignment -> SUCCESS (200)
  // =========================================================================
  try {
    const res = await academicStore.updateRecord(
      'assignment',
      userAAssignId,
      { description: 'Updated instructions by Alice' },
      userA
    );
    const passed = res.status === 'updated';
    results.push({
      id: 'TEST 1',
      name: "User A edits User A's assignment",
      expectedStatus: 200,
      actualStatus: passed ? 200 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 1', name: "User A edits User A's assignment", expectedStatus: 200, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 2: User A deletes User A's assignment -> SUCCESS (200)
  // =========================================================================
  // We'll create a temporary assignment for User A to test deletion
  const aTemp = await academicStore.createRecord(
    'assignment',
    { courseId: 'course_cs101_th', title: 'Temporary Scratchpad Assignment', deadline: '2026-10-30' },
    userA
  );
  const tempAssignId = (aTemp as any).record.id;
  try {
    const res = await academicStore.deleteRecord('assignment', tempAssignId, userA);
    const passed = res.status === 'deleted';
    results.push({
      id: 'TEST 2',
      name: "User A deletes User A's assignment",
      expectedStatus: 200,
      actualStatus: passed ? 200 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 2', name: "User A deletes User A's assignment", expectedStatus: 200, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 3: User A edits User B's assignment -> 403 FORBIDDEN
  // =========================================================================
  try {
    const res = await academicStore.updateRecord(
      'assignment',
      userBAssignId,
      { description: 'Malicious edit by Alice on Bob record' },
      userA
    );
    const passed = res.status === 'forbidden';
    results.push({
      id: 'TEST 3',
      name: "User A edits User B's assignment",
      expectedStatus: 403,
      actualStatus: passed ? 403 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 3', name: "User A edits User B's assignment", expectedStatus: 403, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 4: User A deletes User B's assignment -> 403 FORBIDDEN
  // =========================================================================
  try {
    const res = await academicStore.deleteRecord('assignment', userBAssignId, userA);
    const passed = res.status === 'forbidden';
    results.push({
      id: 'TEST 4',
      name: "User A deletes User B's assignment",
      expectedStatus: 403,
      actualStatus: passed ? 403 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 4', name: "User A deletes User B's assignment", expectedStatus: 403, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 5: User A attempts to modify another user's lecture by changing the ID -> 403 FORBIDDEN
  // =========================================================================
  try {
    const res = await academicStore.updateRecord(
      'lecture',
      userBLectureId,
      { topicsCovered: 'Tampered lecture content by unauthorized User A' },
      userA
    );
    const passed = res.status === 'forbidden';
    results.push({
      id: 'TEST 5',
      name: "User A attempts to modify another user's lecture by changing ID",
      expectedStatus: 403,
      actualStatus: passed ? 403 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 5', name: "User A attempts to modify another user's lecture by changing ID", expectedStatus: 403, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 6: User A attempts to modify another user's quiz by changing the ID -> 403 FORBIDDEN
  // =========================================================================
  try {
    const res = await academicStore.updateRecord(
      'quiz',
      userBQuizId,
      { venue: 'Tampered Venue by unauthorized User A' },
      userA
    );
    const passed = res.status === 'forbidden';
    results.push({
      id: 'TEST 6',
      name: "User A attempts to modify another user's quiz by changing ID",
      expectedStatus: 403,
      actualStatus: passed ? 403 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 6', name: "User A attempts to modify another user's quiz by changing ID", expectedStatus: 403, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 7: Admin edits User A's assignment -> SUCCESS (200)
  // =========================================================================
  try {
    const res = await academicStore.updateRecord(
      'assignment',
      userAAssignId,
      { description: 'Administrative modification by verified Admin' },
      adminUser
    );
    const passed = res.status === 'updated';
    results.push({
      id: 'TEST 7',
      name: "Admin edits User A's assignment",
      expectedStatus: 200,
      actualStatus: passed ? 200 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 7', name: "Admin edits User A's assignment", expectedStatus: 200, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 8: Admin deletes User A's assignment -> SUCCESS (200)
  // =========================================================================
  const aAdminDel = await academicStore.createRecord(
    'assignment',
    { courseId: 'course_cs101_th', title: 'Assignment To Be Deleted By Admin', deadline: '2026-11-01' },
    userA
  );
  const aAdminDelId = (aAdminDel as any).record.id;
  try {
    const res = await academicStore.deleteRecord('assignment', aAdminDelId, adminUser);
    const passed = res.status === 'deleted';
    results.push({
      id: 'TEST 8',
      name: "Admin deletes User A's assignment",
      expectedStatus: 200,
      actualStatus: passed ? 200 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 8', name: "Admin deletes User A's assignment", expectedStatus: 200, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 9: User A creates duplicate assignment -> 409 CONFLICT
  // =========================================================================
  try {
    // User A attempts to create "lab 03 - loop construction" (variation of "Lab 03 – Loop Construction")
    const res = await academicStore.createRecord(
      'assignment',
      {
        courseId: 'course_cs101_th',
        title: ' lab 03 - loop construction ',
        deadline: '2026-10-15',
      },
      userA
    );
    const passed = res.status === 'duplicate';
    results.push({
      id: 'TEST 9',
      name: 'User A creates duplicate assignment',
      expectedStatus: 409,
      actualStatus: passed ? 409 : (res as any).status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 9', name: 'User A creates duplicate assignment', expectedStatus: 409, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 10: User B creates an assignment that already exists for the same subject -> 409 CONFLICT
  // =========================================================================
  try {
    // User B attempts to create the same assignment that User A already created
    const res = await academicStore.createRecord(
      'assignment',
      {
        courseId: 'course_cs101_th',
        title: 'LAB 03 -- LOOP CONSTRUCTION',
        deadline: '2026-10-16',
      },
      userB
    );
    const passed = res.status === 'duplicate';
    results.push({
      id: 'TEST 10',
      name: 'User B creates an assignment that already exists for same subject',
      expectedStatus: 409,
      actualStatus: passed ? 409 : (res as any).status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 10', name: 'User B creates an assignment that already exists for same subject', expectedStatus: 409, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 11: Two users simultaneously create the same assignment -> Only ONE record exists
  // =========================================================================
  try {
    const concurrentTitle = 'Concurrency Test: Binary Search Trees';
    const [p1, p2] = await Promise.all([
      academicStore.createRecord(
        'assignment',
        { courseId: 'course_cs101_th', title: concurrentTitle, deadline: '2026-11-10' },
        userA
      ),
      academicStore.createRecord(
        'assignment',
        { courseId: 'course_cs101_th', title: '  concurrency test : binary search trees  ', deadline: '2026-11-10' },
        userB
      ),
    ]);

    const oneCreated = (p1.status === 'created' && p2.status === 'duplicate') || (p2.status === 'created' && p1.status === 'duplicate');
    results.push({
      id: 'TEST 11',
      name: 'Two users simultaneously create the same assignment',
      expectedStatus: 'Only one created (atomic lock)',
      actualStatus: oneCreated ? 'Only one created (atomic lock)' : `p1:${p1.status}, p2:${p2.status}`,
      passed: oneCreated,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 11', name: 'Two users simultaneously create the same assignment', expectedStatus: 'Atomic lock', actualStatus: 'Error', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 12: User edits an assignment without changing its title -> SUCCESS (200)
  // =========================================================================
  try {
    const res = await academicStore.updateRecord(
      'assignment',
      userAAssignId,
      {
        title: 'Lab 03 – Loop Construction', // Keeping same title
        priority: 'high',
        status: 'in_progress',
      },
      userA
    );
    const passed = res.status === 'updated';
    results.push({
      id: 'TEST 12',
      name: 'User edits an assignment without changing its title',
      expectedStatus: 200,
      actualStatus: passed ? 200 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 12', name: 'User edits an assignment without changing its title', expectedStatus: 200, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 13: User changes an assignment title to another existing assignment's title -> 409 CONFLICT
  // =========================================================================
  try {
    // User A attempts to rename their assignment to User B's assignment title ("Lab 04 – Array Traversals")
    const res = await academicStore.updateRecord(
      'assignment',
      userAAssignId,
      { title: 'Lab 04 – Array Traversals' },
      userA
    );
    const passed = res.status === 'duplicate';
    results.push({
      id: 'TEST 13',
      name: "User changes assignment title to another existing assignment's title",
      expectedStatus: 409,
      actualStatus: passed ? 409 : (res as any).status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 13', name: "User changes assignment title to another existing assignment's title", expectedStatus: 409, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 14: Server validates admin password 'dawoodian4321' correctly
  // =========================================================================
  try {
    const { verifyAdminCredentials, SINGLE_ADMIN_EMAIL } = await import('../auth.ts');
    const isValid = verifyAdminCredentials(SINGLE_ADMIN_EMAIL, 'dawoodian4321');
    results.push({
      id: 'TEST 14',
      name: 'Server validates admin password correctly',
      expectedStatus: 'valid (true)',
      actualStatus: isValid ? 'valid (true)' : 'invalid (false)',
      passed: isValid === true,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 14', name: 'Server validates admin password correctly', expectedStatus: 'valid (true)', actualStatus: 'error', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 15: Server rejects incorrect admin password
  // =========================================================================
  try {
    const { verifyAdminCredentials, SINGLE_ADMIN_EMAIL } = await import('../auth.ts');
    const isInvalid = verifyAdminCredentials(SINGLE_ADMIN_EMAIL, 'wrongpassword123');
    results.push({
      id: 'TEST 15',
      name: 'Server rejects incorrect admin password',
      expectedStatus: 'rejected (false)',
      actualStatus: !isInvalid ? 'rejected (false)' : 'accepted (true)',
      passed: isInvalid === false,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 15', name: 'Server rejects incorrect admin password', expectedStatus: 'rejected (false)', actualStatus: 'error', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 16: Non-admin user cannot assume admin role through user store lookup
  // =========================================================================
  try {
    const { resolveUserFromDatabase } = await import('../auth.ts');
    // Attempt spoofing with student user claiming admin role
    const studentWithAdminClaim = {
      userId: 'user_spoof_attempt',
      email: 'attacker@university.edu',
      name: 'Attacker',
      role: 'admin' as any,
      isSuspended: false
    };
    localUserStore.set(studentWithAdminClaim.userId, studentWithAdminClaim);
    const resolved = await resolveUserFromDatabase('user_spoof_attempt');
    const passed = resolved !== null && resolved.role === 'student';
    results.push({
      id: 'TEST 16',
      name: 'Non-admin user downgraded to student (anti-spoofing)',
      expectedStatus: 'role: student',
      actualStatus: `role: ${resolved?.role}`,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 16', name: 'Non-admin user downgraded to student', expectedStatus: 'role: student', actualStatus: 'error', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 17: Exactly ONE Admin account exists in the system
  // =========================================================================
  try {
    const { purgeUnauthorizedAdmins, SINGLE_ADMIN_EMAIL } = await import('../auth.ts');
    purgeUnauthorizedAdmins();
    const adminAccounts = Array.from(localUserStore.values()).filter(u => u.role === 'admin');
    const passed = adminAccounts.length === 1 && adminAccounts[0].email === SINGLE_ADMIN_EMAIL;
    results.push({
      id: 'TEST 17',
      name: 'Exactly one Admin account exists in the system',
      expectedStatus: '1 admin account',
      actualStatus: `${adminAccounts.length} admin account(s)`,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 17', name: 'Exactly one Admin account exists in the system', expectedStatus: '1 admin account', actualStatus: 'error', passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 18: User A cannot delete User B's lecture -> 403 FORBIDDEN
  // =========================================================================
  try {
    const res = await academicStore.deleteRecord('lecture', userBLectureId, userA);
    const passed = res.status === 'forbidden';
    results.push({
      id: 'TEST 18',
      name: "User A attempts to delete User B's lecture",
      expectedStatus: 403,
      actualStatus: passed ? 403 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 18', name: "User A attempts to delete User B's lecture", expectedStatus: 403, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 19: User A cannot delete User B's quiz -> 403 FORBIDDEN
  // =========================================================================
  try {
    const res = await academicStore.deleteRecord('quiz', userBQuizId, userA);
    const passed = res.status === 'forbidden';
    results.push({
      id: 'TEST 19',
      name: "User A attempts to delete User B's quiz",
      expectedStatus: 403,
      actualStatus: passed ? 403 : res.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 19', name: "User A attempts to delete User B's quiz", expectedStatus: 403, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 20: Admin can delete any user's lecture and quiz -> 200 SUCCESS
  // =========================================================================
  try {
    const lecDel = await academicStore.deleteRecord('lecture', userBLectureId, adminUser);
    const quizDel = await academicStore.deleteRecord('quiz', userBQuizId, adminUser);
    const passed = lecDel.status === 'deleted' && quizDel.status === 'deleted';
    results.push({
      id: 'TEST 20',
      name: "Admin can delete any user's lecture and quiz",
      expectedStatus: 200,
      actualStatus: passed ? 200 : 'failed',
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 20', name: "Admin can delete any user's lecture and quiz", expectedStatus: 200, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 21: Duplicate Lecture Prevention Algorithm -> 409 CONFLICT
  // =========================================================================
  try {
    // Attempt to create a lecture with the same date/topic in the same course
    const res1 = await academicStore.createRecord(
      'lecture',
      { courseId: 'course_cs101_th', title: 'Pointers & Memory Intro', date: '2026-11-05', lectureNumber: 10 },
      userA
    );
    // User B attempts to create duplicate lecture with same title/number
    const res2 = await academicStore.createRecord(
      'lecture',
      { courseId: 'course_cs101_th', title: 'pointers and memory intro', date: '2026-11-05', lectureNumber: 10 },
      userB
    );
    const passed = res1.status === 'created' && res2.status === 'duplicate';
    results.push({
      id: 'TEST 21',
      name: 'Duplicate lecture prevention algorithm catches duplicate submission',
      expectedStatus: 409,
      actualStatus: passed ? 409 : (res2 as any).status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 21', name: 'Duplicate lecture prevention algorithm', expectedStatus: 409, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 22: Duplicate Quiz Prevention Algorithm -> 409 CONFLICT
  // =========================================================================
  try {
    const q1 = await academicStore.createRecord(
      'quiz',
      { courseId: 'course_cs101_th', title: 'Midterm Evaluation 01', date: '2026-11-12', quizNumber: 5 },
      userA
    );
    const q2 = await academicStore.createRecord(
      'quiz',
      { courseId: 'course_cs101_th', title: 'midterm evaluation 01', date: '2026-11-12', quizNumber: 5 },
      userB
    );
    const passed = q1.status === 'created' && q2.status === 'duplicate';
    results.push({
      id: 'TEST 22',
      name: 'Duplicate quiz prevention algorithm catches duplicate submission',
      expectedStatus: 409,
      actualStatus: passed ? 409 : (q2 as any).status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 22', name: 'Duplicate quiz prevention algorithm', expectedStatus: 409, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 23: Admin permanently deletes / wipes a soft-deleted item -> 200 SUCCESS
  // =========================================================================
  try {
    const item = await academicStore.createRecord(
      'assignment',
      { courseId: 'course_cs101_th', title: 'Trash Wipe Test Task', deadline: '2026-11-20' },
      userA
    );
    const itemId = (item as any).record.id;
    // User deletes (soft delete)
    await academicStore.deleteRecord('assignment', itemId, userA);
    // Admin permanently wipes it
    const wipeRes = await academicStore.deleteRecord('assignment', itemId, adminUser);
    const passed = wipeRes.status === 'deleted';
    results.push({
      id: 'TEST 23',
      name: 'Admin permanently wipes a soft-deleted item from trash',
      expectedStatus: 200,
      actualStatus: passed ? 200 : wipeRes.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 23', name: 'Admin permanently wipes a soft-deleted item', expectedStatus: 200, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 24: Admin purges all trash across university database -> 200 SUCCESS
  // =========================================================================
  try {
    const purgeRes = await academicStore.purgeAllTrash(adminUser);
    const passed = purgeRes.status === 'purged';
    results.push({
      id: 'TEST 24',
      name: 'Admin purges all trash across database',
      expectedStatus: 200,
      actualStatus: passed ? 200 : purgeRes.status,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 24', name: 'Admin purges all trash', expectedStatus: 200, actualStatus: 500, passed: false, details: err.message });
  }

  // =========================================================================
  // TEST 25: Regular student cannot purge trash -> 403 FORBIDDEN
  // =========================================================================
  try {
    const studentPurge = await academicStore.purgeAllTrash(userA);
    const passed = studentPurge.status === 'forbidden';
    results.push({
      id: 'TEST 25',
      name: 'Regular student cannot purge all trash',
      expectedStatus: 403,
      actualStatus: passed ? 403 : 200,
      passed,
    });
  } catch (err: any) {
    results.push({ id: 'TEST 25', name: 'Regular student cannot purge all trash', expectedStatus: 403, actualStatus: 500, passed: false, details: err.message });
  }

  const passedTests = results.filter((r) => r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    results,
  };
}
