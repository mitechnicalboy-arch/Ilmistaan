export type UserRole = 'student' | 'admin';

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isSuspended: boolean;
  timezone: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Semester {
  id: string;
  userId: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface Course {
  id: string;
  userId: string;
  semesterId: string;
  name: string;
  code: string;
  instructor: string;
  room: string;
  creditHours: number;
  syllabusSummary: string;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export type PriorityLevel = 'low' | 'medium' | 'high';
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export interface Assignment {
  id: string;
  userId: string;
  semesterId: string;
  courseId: string;
  assignmentNumber?: number;
  title: string;
  description: string;
  dateAssigned: string;
  deadline: string; // YYYY-MM-DD or ISO
  priority: PriorityLevel;
  status: AssignmentStatus;
  resourceLink?: string;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface Lecture {
  id: string;
  userId: string;
  semesterId: string;
  courseId: string;
  lectureNumber: number;
  title: string;
  date: string; // YYYY-MM-DD
  instructor: string;
  topicsCovered: string;
  conceptsSummary: string;
  homeworkTasks?: string;
  slidesUrl?: string;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export type QuizStatus = 'upcoming' | 'completed' | 'missed';

export interface Quiz {
  id: string;
  userId: string;
  semesterId: string;
  courseId: string;
  quizNumber?: number;
  title: string;
  assignedDate: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DDTHH:mm or YYYY-MM-DD (Deadline/Exam Date)
  venue: string;
  syllabusTopics: string;
  totalMarks: number;
  obtainedMarks?: number | null;
  status: QuizStatus;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  persona: 'advisor' | 'tutor' | 'exam' | 'quick';
  model: string;
  content: string;
  timestamp: string;
}

export interface AcademicNote {
  id: string;
  userId: string;
  courseId: string;
  semesterId?: string;
  title: string;
  content?: string;
  isPinned?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type ActiveView = 
  | 'dashboard'
  | 'courses'
  | 'course-detail'
  | 'assignments'
  | 'lectures'
  | 'quizzes'
  | 'calendar'
  | 'reminders'
  | 'pinned'
  | 'trash'
  | 'tutor'
  | 'admin'
  | 'profile';
