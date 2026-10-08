import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { 
  UserProfile, 
  Semester, 
  Course, 
  Assignment, 
  Lecture, 
  Quiz, 
  ChatMessage, 
  ActiveView,
  AssignmentStatus
} from '../types';
import { areAcademicRecordsDuplicate } from '../server/normalization';
import { 
  FALL_2026_SEMESTER, 
  INITIAL_9_COURSES, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_LECTURES, 
  INITIAL_QUIZZES 
} from '../data/initialData';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType,
  testConnection 
} from '../services/firebase';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut as fbSignOut 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot,
  query,
  updateDoc
} from 'firebase/firestore';

import { ConfirmationModalConfig } from '../components/modals/ConfirmationModal';

export type ConfirmModalRequest = Omit<ConfirmationModalConfig, 'isOpen'>;

export interface AcademicContextType {
  // Confirmation Modal
  confirmModal: ConfirmationModalConfig | null;
  requestConfirmation: (req: ConfirmModalRequest) => void;
  closeConfirmation: () => void;

  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  allUsers: UserProfile[];
  updateUserRole: (userId: string, role: 'student' | 'admin') => Promise<void>;
  toggleUserSuspension: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  emptyTrash: () => Promise<{ success: boolean; count: number; error?: string }>;
  
  // Semester
  semesters: Semester[];
  activeSemesterId: string;
  setActiveSemesterId: (id: string) => void;
  activeSemester: Semester | undefined;
  addSemester: (sem: Omit<Semester, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteSemester: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Courses
  courses: Course[];
  activeCourses: Course[];
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
  addCourse: (course: Omit<Course, 'id' | 'userId' | 'semesterId' | 'isArchived' | 'isDeleted' | 'createdAt'>) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string, permanent?: boolean) => Promise<{ success: boolean; error?: string }>;
  restoreCourse: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Assignments
  assignments: Assignment[];
  activeAssignments: Assignment[];
  addAssignment: (assign: Omit<Assignment, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => Promise<{ success: boolean; error?: string; existingRecord?: any }>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<{ success: boolean; error?: string; existingRecord?: any }>;
  toggleAssignmentStatus: (id: string, status?: AssignmentStatus) => Promise<void>;
  toggleAssignmentPin: (id: string) => Promise<void>;
  deleteAssignment: (id: string, permanent?: boolean) => Promise<{ success: boolean; error?: string }>;
  restoreAssignment: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Lectures
  lectures: Lecture[];
  activeLectures: Lecture[];
  addLecture: (lec: Omit<Lecture, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => Promise<{ success: boolean; error?: string; existingRecord?: any }>;
  updateLecture: (id: string, updates: Partial<Lecture>) => Promise<{ success: boolean; error?: string; existingRecord?: any }>;
  toggleLecturePin: (id: string) => Promise<void>;
  deleteLecture: (id: string, permanent?: boolean) => Promise<{ success: boolean; error?: string }>;
  restoreLecture: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Quizzes
  quizzes: Quiz[];
  activeQuizzes: Quiz[];
  addQuiz: (quiz: Omit<Quiz, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => Promise<{ success: boolean; error?: string; existingRecord?: any }>;
  updateQuiz: (id: string, updates: Partial<Quiz>) => Promise<{ success: boolean; error?: string; existingRecord?: any }>;
  recordQuizScore: (id: string, score: number | null) => Promise<void>;
  toggleQuizPin: (id: string) => Promise<void>;
  deleteQuiz: (id: string, permanent?: boolean) => Promise<{ success: boolean; error?: string }>;
  restoreQuiz: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Chat / AI Tutor
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
  clearChatHistory: () => Promise<void>;

  // Navigation & Views
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  navigateToCourse: (courseId: string, section?: 'overview' | 'assignments' | 'quizzes' | 'lectures') => void;
  activeHubTab: 'overview' | 'assignments' | 'quizzes' | 'lectures';
  setActiveHubTab: (tab: 'overview' | 'assignments' | 'quizzes' | 'lectures') => void;
  openSubjectSection: (courseId: string, section?: 'overview' | 'assignments' | 'quizzes' | 'lectures') => void;

  // Subject Pop-up Modal State
  selectedSubjectPopupCourseId: string | null;
  setSelectedSubjectPopupCourseId: (id: string | null) => void;
  selectedSubjectPopupTab: 'assignments' | 'quizzes' | 'lectures' | 'overview';
  setSelectedSubjectPopupTab: (tab: 'assignments' | 'quizzes' | 'lectures' | 'overview') => void;
  selectedSubjectPopupItem: { type: 'assignment' | 'quiz' | 'lecture'; id: string } | null;
  setSelectedSubjectPopupItem: (item: { type: 'assignment' | 'quiz' | 'lecture'; id: string } | null) => void;
  openSubjectPopup: (courseId: string, initialTab?: 'assignments' | 'quizzes' | 'lectures' | 'overview', itemId?: string, itemType?: 'assignment' | 'quiz' | 'lecture') => void;
  closeSubjectPopup: () => void;

  // Selected Detail Views
  selectedAssignmentDetail: Assignment | null;
  setSelectedAssignmentDetail: (a: Assignment | null) => void;
  selectedQuizDetail: Quiz | null;
  setSelectedQuizDetail: (q: Quiz | null) => void;
  selectedLectureDetail: Lecture | null;
  setSelectedLectureDetail: (l: Lecture | null) => void;

  // Editing state for assignments, lectures, quizzes
  editingItem: { type: 'assignment' | 'lecture' | 'quiz'; item: any } | null;
  setEditingItem: (item: { type: 'assignment' | 'lecture' | 'quiz'; item: any } | null) => void;

  // Search & Global modals
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  quickAddType: 'assignment' | 'lecture' | 'quiz';
  setQuickAddType: (type: 'assignment' | 'lecture' | 'quiz') => void;

  // Undo Notification Toast
  undoToast: { message: string; onUndo: () => void } | null;
  setUndoToast: (toast: { message: string; onUndo: () => void } | null) => void;

  // Auth actions
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; isUnauthorizedDomain?: boolean }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isDbConnected: boolean;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

// Exactly ONE Admin account in the system
const SINGLE_ADMIN_ACCOUNT: UserProfile = {
  userId: 'usr_admin_irteza',
  email: 'muhammadirteza2024@gmail.com',
  name: 'Muhammad Irteza',
  role: 'admin',
  isSuspended: false,
  timezone: 'Asia/Karachi (GMT+5)',
  createdAt: '2026-09-01T00:00:00Z',
};

const INITIAL_PORTAL_USERS: UserProfile[] = [
  SINGLE_ADMIN_ACCOUNT,
  {
    userId: 'usr_student_irteza',
    email: 'irteza.student@university.edu',
    name: 'Muhammad Irteza (Student)',
    role: 'student',
    isSuspended: false,
    timezone: 'Asia/Karachi (GMT+5)',
    createdAt: '2026-09-02T08:00:00Z',
  },
  {
    userId: 'usr_student_zain',
    email: 'zain.ali@student.uni.edu',
    name: 'Zain Ali',
    role: 'student',
    isSuspended: false,
    timezone: 'Asia/Karachi (GMT+5)',
    createdAt: '2026-09-02T11:00:00Z',
  },
  {
    userId: 'usr_student_ayesha',
    email: 'ayesha.khan@student.uni.edu',
    name: 'Ayesha Khan',
    role: 'student',
    isSuspended: true,
    timezone: 'Asia/Karachi (GMT+5)',
    createdAt: '2026-09-03T14:30:00Z',
  }
];

export const AcademicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('unidiary_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        // Verify only the single official admin holds admin role
        if (parsed.role === 'admin' && (parsed.email?.toLowerCase() !== 'muhammadirteza2024@gmail.com' || parsed.userId !== 'usr_admin_irteza')) {
          parsed.role = 'student';
        }
        return parsed;
      } catch (_) {
        return null;
      }
    }
    return null;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_PORTAL_USERS);

  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const saved = localStorage.getItem('unidiary_semesters');
    return saved ? JSON.parse(saved) : [{ ...FALL_2026_SEMESTER, userId: currentUser?.userId || 'usr_student_irteza' }];
  });

  const [activeSemesterId, setActiveSemesterId] = useState<string>('sem_fall_2026');

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalConfig | null>(null);

  const requestConfirmation = useCallback((req: ConfirmModalRequest) => {
    setConfirmModal({
      ...req,
      isOpen: true
    });
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmModal(null);
  }, []);

  const [courses, setCourses] = useState<Course[]>(() => {
    const uid = currentUser?.userId || 'usr_student_irteza';
    const defaultCourses = INITIAL_9_COURSES.map(c => ({ ...c, userId: uid }));
    const saved = localStorage.getItem('unidiary_courses_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Course[];
        const merged = defaultCourses.map(def => {
          const found = parsed.find(p => p.id === def.id || p.code === def.code);
          return found ? { ...found, instructor: def.instructor, room: def.room, name: def.name, code: def.code } : def;
        });
        const customCourses = parsed.filter(p => !defaultCourses.some(d => d.id === p.id || d.code === p.code));
        return [...merged, ...customCourses];
      } catch (e) {
        return defaultCourses;
      }
    }
    return defaultCourses;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('unidiary_assignments_v3');
    if (saved) return JSON.parse(saved);
    const uid = currentUser?.userId || 'usr_student_irteza';
    return INITIAL_ASSIGNMENTS.map((a, idx) => ({ ...a, userId: uid, assignmentNumber: a.assignmentNumber || (idx + 1) }));
  });

  const [lectures, setLectures] = useState<Lecture[]>(() => {
    const saved = localStorage.getItem('unidiary_lectures_v3');
    if (saved) return JSON.parse(saved);
    const uid = currentUser?.userId || 'usr_student_irteza';
    return INITIAL_LECTURES.map((l, idx) => ({ ...l, userId: uid, lectureNumber: l.lectureNumber || (idx + 1), title: l.title || l.topicsCovered }));
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem('unidiary_quizzes_v3');
    if (saved) return JSON.parse(saved);
    const uid = currentUser?.userId || 'usr_student_irteza';
    return INITIAL_QUIZZES.map((q, idx) => ({ ...q, userId: uid, quizNumber: q.quizNumber || (idx + 1), assignedDate: q.assignedDate || '2026-09-25' }));
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('unidiary_chat');
    return saved ? JSON.parse(saved) : [
      {
        id: 'msg_initial',
        userId: currentUser?.userId || 'usr_student_irteza',
        role: 'model',
        persona: 'tutor',
        model: 'gemini-3.8-flash',
        content: `Assalam-o-Alaikum & Welcome to ILMISTAAN — Dawoodian's Portal! I am your AI Academic Tutor, fully synchronized with your Fall 2026 semester.\n\nI have loaded all 9 of your registered subjects: Calculus (MATH-101), Functional English (ENG-101), Programming Fundamentals (Theory & Lab), AICT (Theory & Lab), Pakistan Studies (PST-101), Islamiat (ISL-101), and Fahem-ul-Quran (FQ-102).\n\nHow can I help you today? You can choose a persona above or use one of the quick study prompts below!`,
        timestamp: new Date().toISOString()
      }
    ];
  });

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeHubTab, setActiveHubTab] = useState<'overview' | 'assignments' | 'quizzes' | 'lectures'>('overview');
  const [selectedAssignmentDetail, setSelectedAssignmentDetail] = useState<Assignment | null>(null);
  const [selectedQuizDetail, setSelectedQuizDetail] = useState<Quiz | null>(null);
  const [selectedLectureDetail, setSelectedLectureDetail] = useState<Lecture | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: 'assignment' | 'lecture' | 'quiz'; item: any } | null>(null);

  // Subject Pop-up Modal States
  const [selectedSubjectPopupCourseId, setSelectedSubjectPopupCourseId] = useState<string | null>(null);
  const [selectedSubjectPopupTab, setSelectedSubjectPopupTab] = useState<'assignments' | 'quizzes' | 'lectures' | 'overview'>('assignments');
  const [selectedSubjectPopupItem, setSelectedSubjectPopupItem] = useState<{ type: 'assignment' | 'quiz' | 'lecture'; id: string } | null>(null);

  const openSubjectPopup = (
    courseId: string, 
    initialTab: 'assignments' | 'quizzes' | 'lectures' | 'overview' = 'assignments',
    itemId?: string,
    itemType?: 'assignment' | 'quiz' | 'lecture'
  ) => {
    setSelectedSubjectPopupCourseId(courseId);
    setSelectedSubjectPopupTab(initialTab);
    if (itemId && itemType) {
      setSelectedSubjectPopupItem({ type: itemType, id: itemId });
    } else {
      setSelectedSubjectPopupItem(null);
    }
  };

  const closeSubjectPopup = () => {
    setSelectedSubjectPopupCourseId(null);
    setSelectedSubjectPopupItem(null);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'assignment' | 'lecture' | 'quiz'>('assignment');
  const [undoToast, setUndoToast] = useState<{ message: string; onUndo: () => void } | null>(null);
  const [isDbConnected, setIsDbConnected] = useState(true);

  // Sync to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('unidiary_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('unidiary_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('unidiary_semesters', JSON.stringify(semesters));
  }, [semesters]);

  useEffect(() => {
    localStorage.setItem('unidiary_courses_v5', JSON.stringify(courses));
    // Persist all 9 updated courses to Firestore database
    const syncCoursesToDb = async () => {
      const uid = auth.currentUser?.uid || currentUser?.userId;
      if (!uid) return;
      try {
        for (const c of courses) {
          await setDoc(doc(db, `users/${uid}/courses`, c.id), c, { merge: true });
        }
      } catch (err) {
        console.warn('Syncing courses to firestore notice:', err);
      }
    };
    syncCoursesToDb();
  }, [courses, currentUser]);

  useEffect(() => {
    localStorage.setItem('unidiary_assignments_v3', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('unidiary_lectures_v3', JSON.stringify(lectures));
  }, [lectures]);

  useEffect(() => {
    localStorage.setItem('unidiary_quizzes_v3', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('unidiary_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Test Firestore on boot
  useEffect(() => {
    testConnection().then(connected => {
      setIsDbConnected(connected);
    });

    // Validate existing session token against server
    const token = localStorage.getItem('unidiary_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
            localStorage.removeItem('unidiary_user');
            localStorage.removeItem('unidiary_token');
          }
        })
        .catch(() => {});
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setCurrentUser(data);
          } else {
            const newUser: UserProfile = {
              userId: fbUser.uid,
              email: fbUser.email || 'student@university.edu',
              name: fbUser.displayName || 'University Student',
              role: 'student', // ALWAYS student for standard social login
              isSuspended: false,
              timezone: 'Asia/Karachi (GMT+5)',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
          }
        } catch (err) {
          console.warn('Firestore user fetch notice (continuing seamlessly):', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Filtered active records (excluding soft-deleted)
  const activeSemester = useMemo(() => {
    return semesters.find(s => s.id === activeSemesterId) || semesters[0];
  }, [semesters, activeSemesterId]);

  const activeCourses = useMemo(() => {
    return courses.filter(c => !c.isDeleted && c.semesterId === activeSemesterId);
  }, [courses, activeSemesterId]);

  const activeAssignments = useMemo(() => {
    return assignments.filter(a => !a.isDeleted && a.semesterId === activeSemesterId);
  }, [assignments, activeSemesterId]);

  const activeLectures = useMemo(() => {
    return lectures.filter(l => !l.isDeleted && l.semesterId === activeSemesterId);
  }, [lectures, activeSemesterId]);

  const activeQuizzes = useMemo(() => {
    return quizzes.filter(q => !q.isDeleted && q.semesterId === activeSemesterId);
  }, [quizzes, activeSemesterId]);

  // Auth Operations
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; isUnauthorizedDomain?: boolean }> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;
      const profile: UserProfile = {
        userId: fbUser.uid,
        email: fbUser.email || 'student@university.edu',
        name: fbUser.displayName || 'University Student',
        role: 'student', // All Google logins are standard students
        isSuspended: false,
        timezone: 'Asia/Karachi (GMT+5)',
        createdAt: new Date().toISOString()
      };
      const token = `session_${fbUser.uid}_student_${Date.now()}`;
      localStorage.setItem('unidiary_token', token);
      localStorage.setItem('unidiary_user', JSON.stringify(profile));
      try {
        await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
      } catch (e) {
        console.warn('Firestore setDoc notice:', e);
      }
      setCurrentUser(profile);
      return { success: true };
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err);
      const isUnauthorizedDomain = err?.code === 'auth/unauthorized-domain' || 
        (typeof err?.message === 'string' && err.message.includes('auth/unauthorized-domain'));
      
      const customMsg = isUnauthorizedDomain
        ? 'Firebase Error (auth/unauthorized-domain): This Cloud Run preview domain is not in the Firebase Authorized Domains list. Please use the 1-Click Login buttons below or your University Student/Admin credentials.'
        : err?.message || 'Google Sign-In failed.';

      return { 
        success: false, 
        error: customMsg,
        isUnauthorizedDomain
      };
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed.' };
      }
      if (data.user && data.token) {
        localStorage.setItem('unidiary_token', data.token);
        localStorage.setItem('unidiary_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'Unexpected server response.' };
    } catch (err: any) {
      return { success: false, error: 'Server unreachable. Please check connection.' };
    }
  };

  const registerWithEmail = async (fullName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }
      if (data.user && data.token) {
        localStorage.setItem('unidiary_token', data.token);
        localStorage.setItem('unidiary_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'Unexpected server response.' };
    } catch (err: any) {
      return { success: false, error: 'Server unreachable. Please check connection.' };
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(null);
    localStorage.removeItem('unidiary_user');
    localStorage.removeItem('unidiary_token');
  };

  const updateUserRole = async (userId: string, role: 'student' | 'admin') => {
    if (role === 'admin' && userId !== 'usr_admin_irteza') {
      console.warn('System policy: Only one Admin account is permitted in the system.');
      return;
    }
    if (userId === 'usr_admin_irteza' && role !== 'admin') {
      console.warn('System policy: The primary Admin account cannot be demoted.');
      return;
    }
    setAllUsers(prev => prev.map(u => u.userId === userId ? { ...u, role } : u));
    if (currentUser?.userId === userId) {
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    }
    try {
      const token = localStorage.getItem('unidiary_token');
      await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : `Bearer session_${currentUser?.userId}_admin`
        },
        body: JSON.stringify({ role })
      });
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', userId), { role });
      }
    } catch (err) {
      console.warn('Role update notice:', err);
    }
  };

  const toggleUserSuspension = async (userId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.userId === userId) {
        const isSuspended = !u.isSuspended;
        return { ...u, isSuspended };
      }
      return u;
    }));
    if (currentUser?.userId === userId) {
      setCurrentUser(prev => prev ? { ...prev, isSuspended: !prev.isSuspended } : null);
    }
    try {
      if (auth.currentUser) {
        const target = allUsers.find(u => u.userId === userId);
        if (target) {
          await updateDoc(doc(db, 'users', userId), { isSuspended: !target.isSuspended });
        }
      }
    } catch (err) {
      console.warn('Suspension toggle notice:', err);
    }
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Forbidden: Only Academic Administrators can delete user accounts.' };
    }
    if (userId === 'usr_admin_portal' || userId === 'muhammadirteza2024@gmail.com') {
      return { success: false, error: 'Protected: The primary Academic Administrator account cannot be deleted.' };
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Failed to delete user account.' };
      }

      setAllUsers(prev => prev.filter(u => u.userId !== userId));
      setAssignments(prev => prev.filter(a => a.userId !== userId));
      setLectures(prev => prev.filter(l => l.userId !== userId));
      setQuizzes(prev => prev.filter(q => q.userId !== userId));
      setCourses(prev => prev.filter(c => c.userId !== userId));

      try {
        if (auth.currentUser) {
          const { deleteDoc: delDoc, doc: dDoc } = await import('firebase/firestore');
          await delDoc(dDoc(db, 'users', userId));
        }
      } catch (e) {}

      return { success: true };
    } catch (err: any) {
      setAllUsers(prev => prev.filter(u => u.userId !== userId));
      return { success: true };
    }
  };

  const emptyTrash = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    const isAdmin = currentUser?.role === 'admin';
    if (!isAdmin) {
      return { success: false, count: 0, error: 'Forbidden: Only administrator can purge all trash.' };
    }

    const trashedCount = 
      courses.filter(c => c.isDeleted).length +
      assignments.filter(a => a.isDeleted).length +
      lectures.filter(l => l.isDeleted).length +
      quizzes.filter(q => q.isDeleted).length;

    try {
      await fetch('/api/admin/trash/purge-all', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      setCourses(prev => prev.filter(c => !c.isDeleted));
      setAssignments(prev => prev.filter(a => !a.isDeleted));
      setLectures(prev => prev.filter(l => !l.isDeleted));
      setQuizzes(prev => prev.filter(q => !q.isDeleted));

      return { success: true, count: trashedCount };
    } catch (err: any) {
      setCourses(prev => prev.filter(c => !c.isDeleted));
      setAssignments(prev => prev.filter(a => !a.isDeleted));
      setLectures(prev => prev.filter(l => !l.isDeleted));
      setQuizzes(prev => prev.filter(q => !q.isDeleted));
      return { success: true, count: trashedCount };
    }
  };

  // Semesters
  const addSemester = async (sem: Omit<Semester, 'id' | 'userId' | 'createdAt'>) => {
    const id = `sem_${Date.now()}`;
    const newSem: Semester = {
      ...sem,
      id,
      userId: currentUser?.userId || 'usr_student_irteza',
      createdAt: new Date().toISOString()
    };
    setSemesters(prev => [...prev, newSem]);
    setActiveSemesterId(id);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/semesters`, id), newSem);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const deleteSemester = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const isAdmin = currentUser?.role === 'admin';
    if (!isAdmin) {
      return { success: false, error: 'Forbidden: Only an Academic Administrator can delete an academic semester.' };
    }
    if (semesters.length <= 1) {
      return { success: false, error: 'System policy: The portal must retain at least one academic semester.' };
    }
    setSemesters(prev => prev.filter(s => s.id !== id));
    if (activeSemesterId === id) {
      const remaining = semesters.filter(s => s.id !== id);
      if (remaining.length > 0) {
        setActiveSemesterId(remaining[0].id);
      }
    }
    return { success: true };
  };

  // Courses
  const addCourse = async (c: Omit<Course, 'id' | 'userId' | 'semesterId' | 'isArchived' | 'isDeleted' | 'createdAt'>) => {
    const id = `course_${Date.now()}`;
    const newCourse: Course = {
      ...c,
      id,
      userId: currentUser?.userId || 'usr_student_irteza',
      semesterId: activeSemesterId,
      isArchived: false,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };
    setCourses(prev => [...prev, newCourse]);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/courses`, id), newCourse);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/courses`, id), updates);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const deleteCourse = async (id: string, permanent: boolean = false): Promise<{ success: boolean; error?: string }> => {
    const target = courses.find(c => c.id === id);
    const isOwner = target?.userId === currentUser?.userId;
    const isAdmin = currentUser?.role === 'admin';
    if (target && !isOwner && !isAdmin) {
      return { success: false, error: 'Forbidden: Only an Administrator or the course creator can delete this subject.' };
    }

    if (permanent) {
      setCourses(prev => prev.filter(c => c.id !== id));
      try {
        await fetch(`/api/courses/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (auth.currentUser) {
          const { deleteDoc: delDoc, doc: dDoc } = await import('firebase/firestore');
          await delDoc(dDoc(db, 'courses', id));
          if (target?.userId) {
            await delDoc(dDoc(db, `users/${target.userId}/courses`, id));
          }
          await delDoc(dDoc(db, `users/${auth.currentUser.uid}/courses`, id));
        }
      } catch (err) {
        console.warn('Course deletion sync notice:', err);
      }
      return { success: true };
    } else {
      updateCourse(id, { isDeleted: true });
      if (target) {
        setUndoToast({
          message: `Subject "${target.code}" moved to trash bin`,
          onUndo: () => {
            restoreCourse(target.id);
          }
        });
      }
      return { success: true };
    }
  };

  const restoreCourse = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const target = courses.find(c => c.id === id);
    const isOwner = target?.userId === currentUser?.userId;
    const isAdmin = currentUser?.role === 'admin';
    if (target && !isOwner && !isAdmin) {
      return { success: false, error: 'Forbidden: Only an Administrator or creator can restore this subject.' };
    }
    updateCourse(id, { isDeleted: false });
    return { success: true };
  };

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('unidiary_token');
    const uid = currentUser?.userId || auth.currentUser?.uid || 'usr_student_irteza';
    const role = currentUser?.role || 'student';
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : `Bearer session_${uid}_${role}`,
      'x-user-id': uid
    };
  }, [currentUser]);

  // Sync latest records from backend to make sure multi-user data is current
  const syncServerRecords = useCallback(async () => {
    if (!currentUser) return;
    try {
      const headers = getAuthHeaders();
      const [resA, resL, resQ] = await Promise.all([
        fetch('/api/assignments', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/lectures', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/quizzes', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      if (resA?.assignments && Array.isArray(resA.assignments)) {
        setAssignments(prev => {
          const map = new Map<string, Assignment>();
          prev.forEach(item => map.set(item.id, item));
          resA.assignments.forEach((item: Assignment) => map.set(item.id, item));
          return Array.from(map.values());
        });
      }
      if (resL?.lectures && Array.isArray(resL.lectures)) {
        setLectures(prev => {
          const map = new Map<string, Lecture>();
          prev.forEach(item => map.set(item.id, item));
          resL.lectures.forEach((item: Lecture) => map.set(item.id, item));
          return Array.from(map.values());
        });
      }
      if (resQ?.quizzes && Array.isArray(resQ.quizzes)) {
        setQuizzes(prev => {
          const map = new Map<string, Quiz>();
          prev.forEach(item => map.set(item.id, item));
          resQ.quizzes.forEach((item: Quiz) => map.set(item.id, item));
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Sync server records notice:', err);
    }
  }, [currentUser, getAuthHeaders]);

  useEffect(() => {
    if (currentUser) {
      syncServerRecords();
    }
  }, [currentUser, syncServerRecords]);

  // ==========================================
  // ASSIGNMENTS: Permissions & Duplicate Prevention
  // ==========================================
  const addAssignment = async (assign: Omit<Assignment, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => {
    // 1. Client-side duplicate prevention check against existing coursework in subject
    for (const existing of assignments) {
      if (existing.isDeleted || existing.courseId !== assign.courseId) continue;
      const dupCheck = areAcademicRecordsDuplicate(
        {
          type: 'assignment',
          courseId: assign.courseId,
          title: assign.title,
          number: assign.assignmentNumber,
          deadline: assign.deadline
        },
        {
          type: 'assignment',
          courseId: existing.courseId,
          title: existing.title,
          number: existing.assignmentNumber,
          deadline: existing.deadline
        }
      );
      if (dupCheck.isDuplicate) {
        return {
          success: false,
          error: dupCheck.reason || 'This assignment has already been listed for this subject. Duplicate submissions are not allowed.'
        };
      }
    }

    // 2. Server API with atomic lock & authoritative verification
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...assign,
          semesterId: activeSemesterId
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: resData.error || resData.reason || 'This assignment already exists for this subject.',
          existingRecord: resData.existingRecord
        };
      }

      const created: Assignment = resData.assignment;
      setAssignments(prev => [created, ...prev]);
      return { success: true };
    } catch (err: any) {
      // Offline fallback only if network fails
      const id = `assign_${Date.now()}`;
      const newAssign: Assignment = {
        ...assign,
        id,
        userId: currentUser?.userId || 'usr_student_irteza',
        semesterId: activeSemesterId,
        isPinned: false,
        isDeleted: false,
        createdAt: new Date().toISOString()
      };
      setAssignments(prev => [newAssign, ...prev]);
      return { success: true };
    }
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    const target = assignments.find(a => a.id === id);
    if (!target) return { success: false, error: 'Assignment not found.' };

    // PERMISSION CHECK: Only Admin or creator user can edit
    const isOwner = target.userId === currentUser?.userId;
    const isAdmin = currentUser?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Sirf Admin ya item add karne wala student hi ise edit kar sakta hai. Dusre ki ID se add kia huwa assignment edit nahi kia ja sakta.'
      };
    }

    // DUPLICATE CHECK if title, number, or course changes
    if (updates.title || updates.assignmentNumber || updates.courseId) {
      const targetCourseId = updates.courseId || target.courseId;
      const targetTitle = updates.title || target.title;
      for (const existing of assignments) {
        if (existing.isDeleted || existing.id === id || existing.courseId !== targetCourseId) continue;
        const dupCheck = areAcademicRecordsDuplicate(
          {
            type: 'assignment',
            courseId: targetCourseId,
            title: targetTitle,
            number: updates.assignmentNumber || target.assignmentNumber,
            deadline: updates.deadline || target.deadline
          },
          {
            type: 'assignment',
            courseId: existing.courseId,
            title: existing.title,
            number: existing.assignmentNumber,
            deadline: existing.deadline
          }
        );
        if (dupCheck.isDuplicate) {
          return {
            success: false,
            error: dupCheck.reason || 'This assignment title or sequence already exists for this subject.'
          };
        }
      }
    }

    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const resData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: resData.error || 'Failed to update assignment.',
          existingRecord: resData.existingRecord
        };
      }

      setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...resData.assignment } : a));
      return { success: true };
    } catch (err: any) {
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      return { success: true };
    }
  };

  const toggleAssignmentStatus = async (id: string, explicitStatus?: AssignmentStatus) => {
    const target = assignments.find(a => a.id === id);
    if (!target) return;
    const oldStatus = target.status;
    const newStatus = explicitStatus !== undefined ? explicitStatus : (oldStatus === 'completed' ? 'pending' : 'completed');
    
    // Status can be marked completed/pending
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    
    // Show Undo Toast
    setUndoToast({
      message: `Assignment marked as ${newStatus.replace('_', ' ')}`,
      onUndo: () => {
        setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: oldStatus } : a));
      }
    });
  };

  const toggleAssignmentPin = async (id: string) => {
    const target = assignments.find(a => a.id === id);
    if (!target) return;
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
  };

  const deleteAssignment = async (id: string, permanent: boolean = false): Promise<{ success: boolean; error?: string }> => {
    const target = assignments.find(a => a.id === id);
    if (!target) return { success: false, error: 'Assignment not found.' };

    // PERMISSION CHECK: Only Admin or creator user can delete
    const isOwner = target.userId === currentUser?.userId;
    const isAdmin = currentUser?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Only an Academic Administrator or the student author can delete this assignment.'
      };
    }

    // Optimistic UI state update
    if (permanent) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    } else {
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, isDeleted: true } : a));
      setUndoToast({
        message: `Deleted assignment "${target.title}"`,
        onUndo: () => {
          restoreAssignment(target.id);
        }
      });
    }

    try {
      await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  };

  const restoreAssignment = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const target = assignments.find(a => a.id === id);
    const isOwner = target ? target.userId === currentUser?.userId : true;
    const isAdmin = currentUser?.role === 'admin';
    if (target && !isOwner && !isAdmin) {
      return { success: false, error: 'Forbidden: Only an Administrator or the author can restore this assignment.' };
    }
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, isDeleted: false } : a));
    return { success: true };
  };

  // ==========================================
  // LECTURES: Permissions & Duplicate Prevention
  // ==========================================
  const addLecture = async (lec: Omit<Lecture, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => {
    // 1. Client-side duplicate check
    for (const existing of lectures) {
      if (existing.isDeleted || existing.courseId !== lec.courseId) continue;
      const dupCheck = areAcademicRecordsDuplicate(
        {
          type: 'lecture',
          courseId: lec.courseId,
          title: lec.title || lec.topicsCovered,
          number: lec.lectureNumber,
          date: lec.date
        },
        {
          type: 'lecture',
          courseId: existing.courseId,
          title: existing.title || existing.topicsCovered,
          number: existing.lectureNumber,
          date: existing.date
        }
      );
      if (dupCheck.isDuplicate) {
        return {
          success: false,
          error: dupCheck.reason || 'This lecture has already been listed for this subject. Duplicate lectures cannot be added.'
        };
      }
    }

    try {
      const response = await fetch('/api/lectures', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...lec,
          semesterId: activeSemesterId
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: resData.error || resData.reason || 'This lecture already exists for this subject.',
          existingRecord: resData.existingRecord
        };
      }

      const created: Lecture = resData.lecture;
      setLectures(prev => [created, ...prev]);
      return { success: true };
    } catch (err: any) {
      const id = `lec_${Date.now()}`;
      const newLec: Lecture = {
        ...lec,
        id,
        userId: currentUser?.userId || 'usr_student_irteza',
        semesterId: activeSemesterId,
        isPinned: false,
        isDeleted: false,
        createdAt: new Date().toISOString()
      };
      setLectures(prev => [newLec, ...prev]);
      return { success: true };
    }
  };

  const updateLecture = async (id: string, updates: Partial<Lecture>) => {
    const target = lectures.find(l => l.id === id);
    if (!target) return { success: false, error: 'Lecture not found.' };

    // PERMISSION CHECK: Only Admin or creator user can edit
    const isOwner = target.userId === currentUser?.userId;
    const isAdmin = currentUser?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Sirf Admin ya item add karne wala student hi ise edit kar sakta hai. Dusre ki ID se add kia huwa lecture edit nahi kia ja sakta.'
      };
    }

    // DUPLICATE CHECK if title, number, date or course changes
    if (updates.title || updates.topicsCovered || updates.lectureNumber || updates.date || updates.courseId) {
      const targetCourseId = updates.courseId || target.courseId;
      const targetTitle = updates.title || updates.topicsCovered || target.title || target.topicsCovered;
      for (const existing of lectures) {
        if (existing.isDeleted || existing.id === id || existing.courseId !== targetCourseId) continue;
        const dupCheck = areAcademicRecordsDuplicate(
          {
            type: 'lecture',
            courseId: targetCourseId,
            title: targetTitle,
            number: updates.lectureNumber || target.lectureNumber,
            date: updates.date || target.date
          },
          {
            type: 'lecture',
            courseId: existing.courseId,
            title: existing.title || existing.topicsCovered,
            number: existing.lectureNumber,
            date: existing.date
          }
        );
        if (dupCheck.isDuplicate) {
          return {
            success: false,
            error: dupCheck.reason || 'This lecture title, number, or date already exists for this subject.'
          };
        }
      }
    }

    try {
      const response = await fetch(`/api/lectures/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const resData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: resData.error || 'Failed to update lecture.',
          existingRecord: resData.existingRecord
        };
      }

      setLectures(prev => prev.map(l => l.id === id ? { ...l, ...resData.lecture } : l));
      return { success: true };
    } catch (err: any) {
      setLectures(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      return { success: true };
    }
  };

  const toggleLecturePin = async (id: string) => {
    const target = lectures.find(l => l.id === id);
    if (!target) return;
    setLectures(prev => prev.map(l => l.id === id ? { ...l, isPinned: !l.isPinned } : l));
  };

  const deleteLecture = async (id: string, permanent: boolean = false): Promise<{ success: boolean; error?: string }> => {
    const target = lectures.find(l => l.id === id);
    if (!target) return { success: false, error: 'Lecture not found.' };

    // PERMISSION CHECK: Only Admin or creator user can delete
    const isOwner = target.userId === currentUser?.userId;
    const isAdmin = currentUser?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Only an Academic Administrator or the note author can delete this lecture.'
      };
    }

    // Optimistic UI state update
    if (permanent) {
      setLectures(prev => prev.filter(l => l.id !== id));
    } else {
      setLectures(prev => prev.map(l => l.id === id ? { ...l, isDeleted: true } : l));
      setUndoToast({
        message: `Deleted lecture "${target.title || target.topicsCovered}"`,
        onUndo: () => {
          restoreLecture(target.id);
        }
      });
    }

    try {
      await fetch(`/api/lectures/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  };

  const restoreLecture = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const target = lectures.find(l => l.id === id);
    const isOwner = target ? target.userId === currentUser?.userId : true;
    const isAdmin = currentUser?.role === 'admin';
    if (target && !isOwner && !isAdmin) {
      return { success: false, error: 'Forbidden: Only an Administrator or the author can restore this lecture note.' };
    }
    setLectures(prev => prev.map(l => l.id === id ? { ...l, isDeleted: false } : l));
    return { success: true };
  };

  // ==========================================
  // QUIZZES: Permissions & Duplicate Prevention
  // ==========================================
  const addQuiz = async (quiz: Omit<Quiz, 'id' | 'userId' | 'semesterId' | 'isPinned' | 'isDeleted' | 'createdAt'>) => {
    // 1. Client-side duplicate check
    for (const existing of quizzes) {
      if (existing.isDeleted || existing.courseId !== quiz.courseId) continue;
      const dupCheck = areAcademicRecordsDuplicate(
        {
          type: 'quiz',
          courseId: quiz.courseId,
          title: quiz.title,
          number: quiz.quizNumber,
          date: quiz.date
        },
        {
          type: 'quiz',
          courseId: existing.courseId,
          title: existing.title,
          number: existing.quizNumber,
          date: existing.date
        }
      );
      if (dupCheck.isDuplicate) {
        return {
          success: false,
          error: dupCheck.reason || 'This quiz has already been listed for this subject. Duplicate quizzes cannot be added.'
        };
      }
    }

    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...quiz,
          semesterId: activeSemesterId
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: resData.error || resData.reason || 'This quiz already exists for this subject.',
          existingRecord: resData.existingRecord
        };
      }

      const created: Quiz = resData.quiz;
      setQuizzes(prev => [created, ...prev]);
      return { success: true };
    } catch (err: any) {
      const id = `quiz_${Date.now()}`;
      const newQuiz: Quiz = {
        ...quiz,
        id,
        userId: currentUser?.userId || 'usr_student_irteza',
        semesterId: activeSemesterId,
        isPinned: false,
        isDeleted: false,
        createdAt: new Date().toISOString()
      };
      setQuizzes(prev => [newQuiz, ...prev]);
      return { success: true };
    }
  };

  const updateQuiz = async (id: string, updates: Partial<Quiz>) => {
    const target = quizzes.find(q => q.id === id);
    if (!target) return { success: false, error: 'Quiz not found.' };

    // PERMISSION CHECK: Only Admin or creator user can edit
    const isOwner = target.userId === currentUser?.userId;
    const isAdmin = currentUser?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Sirf Admin ya item add karne wala student hi ise edit kar sakta hai. Dusre ki ID se add kia huwa quiz edit nahi kia ja sakta.'
      };
    }

    // DUPLICATE CHECK if title, number, date or course changes
    if (updates.title || updates.quizNumber || updates.date || updates.courseId) {
      const targetCourseId = updates.courseId || target.courseId;
      const targetTitle = updates.title || target.title;
      for (const existing of quizzes) {
        if (existing.isDeleted || existing.id === id || existing.courseId !== targetCourseId) continue;
        const dupCheck = areAcademicRecordsDuplicate(
          {
            type: 'quiz',
            courseId: targetCourseId,
            title: targetTitle,
            number: updates.quizNumber || target.quizNumber,
            date: updates.date || target.date
          },
          {
            type: 'quiz',
            courseId: existing.courseId,
            title: existing.title,
            number: existing.quizNumber,
            date: existing.date
          }
        );
        if (dupCheck.isDuplicate) {
          return {
            success: false,
            error: dupCheck.reason || 'This quiz title, number, or date already exists for this subject.'
          };
        }
      }
    }

    try {
      const response = await fetch(`/api/quizzes/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const resData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: resData.error || 'Failed to update quiz.',
          existingRecord: resData.existingRecord
        };
      }

      setQuizzes(prev => prev.map(q => q.id === id ? { ...q, ...resData.quiz } : q));
      return { success: true };
    } catch (err: any) {
      setQuizzes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
      return { success: true };
    }
  };

  const recordQuizScore = async (id: string, score: number | null) => {
    await updateQuiz(id, { obtainedMarks: score, status: score !== null ? 'completed' : 'upcoming' });
  };

  const toggleQuizPin = async (id: string) => {
    const target = quizzes.find(q => q.id === id);
    if (!target) return;
    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, isPinned: !q.isPinned } : q));
  };

  const deleteQuiz = async (id: string, permanent: boolean = false): Promise<{ success: boolean; error?: string }> => {
    const target = quizzes.find(q => q.id === id);
    if (!target) return { success: false, error: 'Quiz not found.' };

    // PERMISSION CHECK: Only Admin or creator user can delete
    const isOwner = target.userId === currentUser?.userId;
    const isAdmin = currentUser?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Only an Academic Administrator or the quiz author can delete this quiz.'
      };
    }

    // Optimistic UI state update
    if (permanent) {
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } else {
      setQuizzes(prev => prev.map(q => q.id === id ? { ...q, isDeleted: true } : q));
      setUndoToast({
        message: `Deleted quiz "${target.title}"`,
        onUndo: () => {
          restoreQuiz(target.id);
        }
      });
    }

    try {
      await fetch(`/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  };

  const restoreQuiz = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const target = quizzes.find(q => q.id === id);
    const isOwner = target ? target.userId === currentUser?.userId : true;
    const isAdmin = currentUser?.role === 'admin';
    if (target && !isOwner && !isAdmin) {
      return { success: false, error: 'Forbidden: Only an Administrator or the author can restore this quiz.' };
    }
    setQuizzes(prev => prev.map(q => q.id === id ? { ...q, isDeleted: false } : q));
    return { success: true };
  };

  // Chat / AI Tutor
  const addChatMessage = async (msg: Omit<ChatMessage, 'id' | 'userId' | 'timestamp'>) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: ChatMessage = {
      ...msg,
      id,
      userId: currentUser?.userId || 'usr_student_irteza',
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newMsg]);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/chatMessages`, id), newMsg);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const clearChatHistory = async () => {
    setChatMessages([]);
    localStorage.removeItem('unidiary_chat');
  };

  const navigateToCourse = (courseId: string, section: 'overview' | 'assignments' | 'quizzes' | 'lectures' = 'assignments') => {
    setSelectedCourseId(courseId);
    setActiveHubTab(section);
    closeSubjectPopup();
    setActiveView('course-detail');
  };

  const openSubjectSection = (courseId: string, section: 'overview' | 'assignments' | 'quizzes' | 'lectures' = 'assignments') => {
    setSelectedCourseId(courseId);
    setActiveHubTab(section);
    closeSubjectPopup();
    setActiveView('course-detail');
  };

  return (
    <AcademicContext.Provider value={{
      confirmModal,
      requestConfirmation,
      closeConfirmation,
      currentUser,
      setCurrentUser,
      allUsers,
      updateUserRole,
      toggleUserSuspension,
      deleteUser,
      emptyTrash,
      semesters,
      activeSemesterId,
      setActiveSemesterId,
      activeSemester,
      addSemester,
      deleteSemester,
      courses,
      activeCourses,
      selectedCourseId,
      setSelectedCourseId,
      activeHubTab,
      setActiveHubTab,
      openSubjectSection,
      selectedSubjectPopupCourseId,
      setSelectedSubjectPopupCourseId,
      selectedSubjectPopupTab,
      setSelectedSubjectPopupTab,
      selectedSubjectPopupItem,
      setSelectedSubjectPopupItem,
      openSubjectPopup,
      closeSubjectPopup,
      selectedAssignmentDetail,
      setSelectedAssignmentDetail,
      selectedQuizDetail,
      setSelectedQuizDetail,
      selectedLectureDetail,
      setSelectedLectureDetail,
      editingItem,
      setEditingItem,
      addCourse,
      updateCourse,
      deleteCourse,
      restoreCourse,
      assignments,
      activeAssignments,
      addAssignment,
      updateAssignment,
      toggleAssignmentStatus,
      toggleAssignmentPin,
      deleteAssignment,
      restoreAssignment,
      lectures,
      activeLectures,
      addLecture,
      updateLecture,
      toggleLecturePin,
      deleteLecture,
      restoreLecture,
      quizzes,
      activeQuizzes,
      addQuiz,
      updateQuiz,
      recordQuizScore,
      toggleQuizPin,
      deleteQuiz,
      restoreQuiz,
      chatMessages,
      addChatMessage,
      clearChatHistory,
      activeView,
      setActiveView,
      navigateToCourse,
      searchQuery,
      setSearchQuery,
      isQuickAddOpen,
      setIsQuickAddOpen,
      quickAddType,
      setQuickAddType,
      undoToast,
      setUndoToast,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      signOut,
      isDbConnected
    }}>
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
