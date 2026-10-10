import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { Course, Semester, Assignment, Lecture, Quiz, UserProfile, ChatMessage } from '../types/index.ts';

// Resolve Supabase configuration from environment variables or provided project credentials
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL)) ||
  (typeof process !== 'undefined' && (process.env?.SUPABASE_URL || process.env?.NEXT_PUBLIC_SUPABASE_URL)) ||
  'https://lujytbmxoswazoyfvrck.supabase.co';

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  (typeof process !== 'undefined' && (process.env?.SUPABASE_ANON_KEY || process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  'sb_publishable_4h4YhuQZWlrwLWmaCZVJ4g_imbgKInS';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// Singleton Supabase Client
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseInstance && isSupabaseConfigured()) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
    }
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

export const SINGLE_ADMIN_EMAIL = 'muhammadirteza2024@gmail.com';

/**
 * Complete PostgreSQL Row Level Security (RLS) and Schema Migration Script.
 * Generated for direct execution in Supabase Dashboard -> SQL Editor.
 */
export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- ILMISTAAN ACADEMIC PORTAL - SUPABASE SECURITY & AUTHENTICATION MIGRATION
-- Migration: 20261010_academic_security_overhaul.sql
-- Description: Enforces strict Row Level Security (RLS), authenticates students,
--              secures single-admin authority, and isolates student deliverables.
-- ============================================================================

-- Step 1: Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create Core Tables (if not already created)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Karachi (GMT+5)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.semesters (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  semester_id TEXT REFERENCES public.semesters(id) ON DELETE SET NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  instructor TEXT NOT NULL,
  room TEXT NOT NULL,
  credit_hours INTEGER NOT NULL DEFAULT 3,
  syllabus_summary TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id TEXT,
  semester_id TEXT,
  assignment_number INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  date_assigned TEXT,
  deadline TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  resource_link TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lectures (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id TEXT,
  semester_id TEXT,
  lecture_number INTEGER NOT NULL DEFAULT 1,
  title TEXT,
  date TEXT NOT NULL,
  instructor TEXT,
  topics_covered TEXT NOT NULL,
  concepts_summary TEXT,
  homework_tasks TEXT,
  slides_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id TEXT,
  semester_id TEXT,
  quiz_number INTEGER,
  title TEXT NOT NULL,
  assigned_date TEXT,
  date TEXT NOT NULL,
  venue TEXT,
  syllabus_topics TEXT,
  total_marks INTEGER NOT NULL DEFAULT 10,
  obtained_marks INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'missed')),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  persona TEXT DEFAULT 'tutor',
  model TEXT DEFAULT 'gemini-2.5-flash',
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Define Security Helper Functions (SECURITY DEFINER in public schema)

-- 3.1 Check if caller is the single authorized Academic Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    auth.role() = 'authenticated'
    AND (
      auth.jwt() ->> 'email' = 'muhammadirteza2024@gmail.com'
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (auth.uid())::text
          AND email = 'muhammadirteza2024@gmail.com'
          AND role = 'admin'
      )
    )
  );
$$;

-- 3.2 Check if user is authenticated and not suspended
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    auth.role() = 'authenticated'
    AND (
      -- Single admin is always active
      auth.jwt() ->> 'email' = 'muhammadirteza2024@gmail.com'
      OR NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (auth.uid())::text
          AND is_suspended = TRUE
      )
    )
  );
$$;

-- 3.3 Check if caller owns the record or has admin authority
CREATE OR REPLACE FUNCTION public.is_record_owner(target_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    public.is_active_user()
    AND (
      (auth.uid())::text = target_user_id
      OR public.is_admin()
    )
  );
$$;

-- Step 4: Drop old / conflicting policies to prevent privilege leaks
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('users', 'semesters', 'courses', 'assignments', 'lectures', 'quizzes', 'chat_messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Step 5: Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 6: Security Policies for public.users
-- ============================================================================

-- 6.1 SELECT: Active non-suspended users and admins can view user directory; own profile is always visible
CREATE POLICY "users_select_policy"
ON public.users
FOR SELECT
TO authenticated
USING (
  id = (auth.uid())::text
  OR public.is_active_user()
);

-- 6.2 INSERT: Users can register themselves with student role only (privilege escalation blocked)
CREATE POLICY "users_insert_policy"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  id = (auth.uid())::text
  AND (
    (role = 'student' AND is_suspended = FALSE)
    OR (role = 'admin' AND auth.jwt() ->> 'email' = 'muhammadirteza2024@gmail.com')
  )
);

-- 6.3 UPDATE: Admin can update any fields (including role & suspension);
--              Students can update only own profile but CANNOT change role or is_suspended
CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (public.is_active_user() AND id = (auth.uid())::text)
)
WITH CHECK (
  public.is_admin()
  OR (
    public.is_active_user()
    AND id = (auth.uid())::text
    -- Block role escalation and self-unsuspension
    AND role = (SELECT u.role FROM public.users u WHERE u.id = (auth.uid())::text)
    AND is_suspended = (SELECT u.is_suspended FROM public.users u WHERE u.id = (auth.uid())::text)
  )
);

-- 6.4 DELETE: Sole Administrator can delete users (primary admin account protected)
CREATE POLICY "users_delete_policy"
ON public.users
FOR DELETE
TO authenticated
USING (
  public.is_admin()
  AND email != 'muhammadirteza2024@gmail.com'
);

-- ============================================================================
-- Step 7: Security Policies for Shared Academic Data
-- Courses, Semesters, Assignments, Lectures, Quizzes
-- Rule: Every authenticated, non-suspended student can VIEW all student records
-- Rule: Students can INSERT, UPDATE, DELETE ONLY records they own
-- Rule: Single Administrator has full rights to manage any record
-- ============================================================================

-- 7.1 Courses
CREATE POLICY "courses_select_active"
ON public.courses FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "courses_insert_owner"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
);

CREATE POLICY "courses_update_owner"
ON public.courses FOR UPDATE TO authenticated
USING (public.is_record_owner(user_id))
WITH CHECK (public.is_record_owner(user_id));

CREATE POLICY "courses_delete_owner"
ON public.courses FOR DELETE TO authenticated
USING (public.is_record_owner(user_id));

-- 7.2 Semesters
CREATE POLICY "semesters_select_active"
ON public.semesters FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "semesters_insert_owner"
ON public.semesters FOR INSERT TO authenticated
WITH CHECK (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
);

CREATE POLICY "semesters_update_owner"
ON public.semesters FOR UPDATE TO authenticated
USING (public.is_record_owner(user_id))
WITH CHECK (public.is_record_owner(user_id));

CREATE POLICY "semesters_delete_owner"
ON public.semesters FOR DELETE TO authenticated
USING (public.is_record_owner(user_id));

-- 7.3 Assignments
CREATE POLICY "assignments_select_active"
ON public.assignments FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "assignments_insert_owner"
ON public.assignments FOR INSERT TO authenticated
WITH CHECK (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
);

CREATE POLICY "assignments_update_owner"
ON public.assignments FOR UPDATE TO authenticated
USING (public.is_record_owner(user_id))
WITH CHECK (public.is_record_owner(user_id));

CREATE POLICY "assignments_delete_owner"
ON public.assignments FOR DELETE TO authenticated
USING (public.is_record_owner(user_id));

-- 7.4 Lectures
CREATE POLICY "lectures_select_active"
ON public.lectures FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "lectures_insert_owner"
ON public.lectures FOR INSERT TO authenticated
WITH CHECK (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
);

CREATE POLICY "lectures_update_owner"
ON public.lectures FOR UPDATE TO authenticated
USING (public.is_record_owner(user_id))
WITH CHECK (public.is_record_owner(user_id));

CREATE POLICY "lectures_delete_owner"
ON public.lectures FOR DELETE TO authenticated
USING (public.is_record_owner(user_id));

-- 7.5 Quizzes
CREATE POLICY "quizzes_select_active"
ON public.quizzes FOR SELECT TO authenticated
USING (public.is_active_user());

CREATE POLICY "quizzes_insert_owner"
ON public.quizzes FOR INSERT TO authenticated
WITH CHECK (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
);

CREATE POLICY "quizzes_update_owner"
ON public.quizzes FOR UPDATE TO authenticated
USING (public.is_record_owner(user_id))
WITH CHECK (public.is_record_owner(user_id));

CREATE POLICY "quizzes_delete_owner"
ON public.quizzes FOR DELETE TO authenticated
USING (public.is_record_owner(user_id));

-- ============================================================================
-- Step 8: Security Policies for AI Tutor Chat Messages (Private Isolation)
-- Rule: Students can access ONLY their own AI tutor messages
-- ============================================================================

CREATE POLICY "chat_messages_select_owner_only"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
);

CREATE POLICY "chat_messages_insert_owner_only"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
);

CREATE POLICY "chat_messages_update_owner_only"
ON public.chat_messages FOR UPDATE TO authenticated
USING (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
)
WITH CHECK (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
);

CREATE POLICY "chat_messages_delete_owner_only"
ON public.chat_messages FOR DELETE TO authenticated
USING (
  public.is_active_user()
  AND (user_id = (auth.uid())::text OR public.is_admin())
);

-- ============================================================================
-- Step 9: Automatic Profile Creation Trigger on Supabase Auth SignUp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    is_suspended,
    timezone
  ) VALUES (
    new.id::text,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    CASE
      WHEN new.email = 'muhammadirteza2024@gmail.com' THEN 'admin'
      ELSE 'student'
    END,
    FALSE,
    'Asia/Karachi (GMT+5)'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- Step 10: Seed Primary Administrator Account
-- ============================================================================
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  is_suspended,
  timezone
) VALUES (
  'usr_admin_irteza',
  'muhammadirteza2024@gmail.com',
  'Muhammad Irteza',
  'admin',
  FALSE,
  'Asia/Karachi (GMT+5)'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_suspended = FALSE,
  email = 'muhammadirteza2024@gmail.com';
`;

export interface SupabaseAuthResult {
  success: boolean;
  user?: UserProfile;
  session?: Session;
  error?: string;
  isSuspended?: boolean;
}

/**
 * Sign in using Supabase Auth and verify suspension status in public.users
 */
export async function supabaseSignIn(email: string, pass: string): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured in environment.' };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Invalid email or password.' };
    }

    // Verify user profile and suspension status in public.users
    const { data: userProfile, error: profileError } = await client
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userProfile && userProfile.is_suspended) {
      await client.auth.signOut();
      return {
        success: false,
        error: 'Forbidden: Your academic account has been suspended by an administrator.',
        isSuspended: true
      };
    }

    const isAdmin = data.user.email?.toLowerCase() === SINGLE_ADMIN_EMAIL;
    const profile: UserProfile = {
      userId: data.user.id,
      email: data.user.email || email,
      name: userProfile?.name || data.user.user_metadata?.full_name || 'University Student',
      role: isAdmin ? 'admin' : (userProfile?.role || 'student'),
      isSuspended: userProfile?.is_suspended || false,
      timezone: userProfile?.timezone || 'Asia/Karachi (GMT+5)',
      createdAt: userProfile?.created_at || new Date().toISOString()
    };

    return {
      success: true,
      user: profile,
      session: data.session || undefined
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase authentication failed.' };
  }
}

/**
 * Register student using Supabase Auth
 */
export async function supabaseSignUp(fullName: string, email: string, pass: string): Promise<SupabaseAuthResult> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured in environment.' };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === SINGLE_ADMIN_EMAIL;

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          full_name: fullName.trim()
        }
      }
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Registration failed.' };
    }

    // Upsert student profile in public.users
    const profile: UserProfile = {
      userId: data.user.id,
      email: cleanEmail,
      name: fullName.trim(),
      role: isAdmin ? 'admin' : 'student',
      isSuspended: false,
      timezone: 'Asia/Karachi (GMT+5)',
      createdAt: new Date().toISOString()
    };

    try {
      await client.from('users').upsert({
        id: profile.userId,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        is_suspended: false,
        timezone: profile.timezone
      }, { onConflict: 'id' });
    } catch (_) {}

    return {
      success: true,
      user: profile,
      session: data.session || undefined
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed.' };
  }
}

/**
 * Sign out from Supabase Auth
 */
export async function supabaseSignOut(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (_) {}
  }
}

export interface SupabaseTransferReport {
  timestamp: string;
  success: boolean;
  isConfigured: boolean;
  totalRecords: number;
  tables: {
    name: string;
    count: number;
    status: 'transferred' | 'skipped' | 'failed';
    error?: string;
  }[];
  sqlSchema: string;
  jsonDataExport: string;
}

/**
 * Transfers all dataset records directly to Supabase PostgreSQL tables
 */
export async function transferAllDataToSupabase(payload: {
  users: UserProfile[];
  semesters: Semester[];
  courses: Course[];
  assignments: Assignment[];
  lectures: Lecture[];
  quizzes: Quiz[];
  chatMessages?: ChatMessage[];
}): Promise<SupabaseTransferReport> {
  const client = getSupabaseClient();
  const isConfigured = isSupabaseConfigured();

  const dataExport = JSON.stringify(payload, null, 2);

  const report: SupabaseTransferReport = {
    timestamp: new Date().toISOString(),
    success: false,
    isConfigured,
    totalRecords: 
      payload.users.length +
      payload.semesters.length +
      payload.courses.length +
      payload.assignments.length +
      payload.lectures.length +
      payload.quizzes.length +
      (payload.chatMessages?.length || 0),
    tables: [],
    sqlSchema: SUPABASE_SQL_SCHEMA,
    jsonDataExport: dataExport,
  };

  // If Supabase credentials are not connected yet, return export and schema ready for setup
  if (!client || !isConfigured) {
    report.tables = [
      { name: 'users', count: payload.users.length, status: 'skipped', error: 'Supabase credentials not configured in environment' },
      { name: 'semesters', count: payload.semesters.length, status: 'skipped', error: 'Supabase credentials not configured in environment' },
      { name: 'courses', count: payload.courses.length, status: 'skipped', error: 'Supabase credentials not configured in environment' },
      { name: 'assignments', count: payload.assignments.length, status: 'skipped', error: 'Supabase credentials not configured in environment' },
      { name: 'lectures', count: payload.lectures.length, status: 'skipped', error: 'Supabase credentials not configured in environment' },
      { name: 'quizzes', count: payload.quizzes.length, status: 'skipped', error: 'Supabase credentials not configured in environment' },
    ];
    return report;
  }

  try {
    // 1. Transfer Users
    if (payload.users.length > 0) {
      const formattedUsers = payload.users.map(u => ({
        id: u.userId,
        email: u.email,
        name: u.name,
        role: u.role,
        is_suspended: u.isSuspended,
        timezone: u.timezone || 'Asia/Karachi (GMT+5)',
      }));
      const { error } = await client.from('users').upsert(formattedUsers, { onConflict: 'id' });
      report.tables.push({
        name: 'users',
        count: formattedUsers.length,
        status: error ? 'failed' : 'transferred',
        error: error?.message,
      });
    }

    // 2. Transfer Semesters
    if (payload.semesters.length > 0) {
      const formattedSemesters = payload.semesters.map(s => ({
        id: s.id,
        user_id: s.userId,
        name: s.name,
        academic_year: s.academicYear,
        start_date: s.startDate,
        end_date: s.endDate,
        status: s.status,
      }));
      const { error } = await client.from('semesters').upsert(formattedSemesters, { onConflict: 'id' });
      report.tables.push({
        name: 'semesters',
        count: formattedSemesters.length,
        status: error ? 'failed' : 'transferred',
        error: error?.message,
      });
    }

    // 3. Transfer Courses
    if (payload.courses.length > 0) {
      const formattedCourses = payload.courses.map(c => ({
        id: c.id,
        semester_id: c.semesterId,
        user_id: c.userId,
        name: c.name,
        code: c.code,
        instructor: c.instructor,
        room: c.room,
        credit_hours: c.creditHours,
        syllabus_summary: c.syllabusSummary,
        is_archived: c.isArchived,
        is_deleted: c.isDeleted,
      }));
      const { error } = await client.from('courses').upsert(formattedCourses, { onConflict: 'id' });
      report.tables.push({
        name: 'courses',
        count: formattedCourses.length,
        status: error ? 'failed' : 'transferred',
        error: error?.message,
      });
    }

    // 4. Transfer Assignments
    if (payload.assignments.length > 0) {
      const formattedAssignments = payload.assignments.map(a => ({
        id: a.id,
        course_id: a.courseId,
        user_id: a.userId,
        semester_id: a.semesterId,
        assignment_number: a.assignmentNumber,
        title: a.title,
        description: a.description || '',
        date_assigned: a.dateAssigned,
        deadline: a.deadline,
        status: a.status,
        priority: a.priority,
        resource_link: a.resourceLink || '',
        is_pinned: a.isPinned || false,
        is_deleted: a.isDeleted || false,
      }));
      const { error } = await client.from('assignments').upsert(formattedAssignments, { onConflict: 'id' });
      report.tables.push({
        name: 'assignments',
        count: formattedAssignments.length,
        status: error ? 'failed' : 'transferred',
        error: error?.message,
      });
    }

    // 5. Transfer Lectures
    if (payload.lectures.length > 0) {
      const formattedLectures = payload.lectures.map(l => ({
        id: l.id,
        course_id: l.courseId,
        user_id: l.userId,
        semester_id: l.semesterId,
        title: l.title || '',
        lecture_number: l.lectureNumber || 1,
        date: l.date,
        instructor: l.instructor || '',
        topics_covered: l.topicsCovered || '',
        concepts_summary: l.conceptsSummary || '',
        homework_tasks: l.homeworkTasks || '',
        slides_url: l.slidesUrl || '',
        is_pinned: l.isPinned || false,
        is_deleted: l.isDeleted || false,
      }));
      const { error } = await client.from('lectures').upsert(formattedLectures, { onConflict: 'id' });
      report.tables.push({
        name: 'lectures',
        count: formattedLectures.length,
        status: error ? 'failed' : 'transferred',
        error: error?.message,
      });
    }

    // 6. Transfer Quizzes
    if (payload.quizzes.length > 0) {
      const formattedQuizzes = payload.quizzes.map(q => ({
        id: q.id,
        course_id: q.courseId,
        user_id: q.userId,
        semester_id: q.semesterId,
        quiz_number: q.quizNumber,
        title: q.title,
        assigned_date: q.assignedDate || '',
        date: q.date,
        venue: q.venue || '',
        syllabus_topics: q.syllabusTopics || '',
        total_marks: q.totalMarks || 10,
        obtained_marks: q.obtainedMarks ?? null,
        status: q.status,
        is_pinned: q.isPinned || false,
        is_deleted: q.isDeleted || false,
      }));
      const { error } = await client.from('quizzes').upsert(formattedQuizzes, { onConflict: 'id' });
      report.tables.push({
        name: 'quizzes',
        count: formattedQuizzes.length,
        status: error ? 'failed' : 'transferred',
        error: error?.message,
      });
    }

    // 7. Transfer Chat Messages
    if (payload.chatMessages && payload.chatMessages.length > 0) {
      const formattedMessages = payload.chatMessages.map(m => ({
        id: m.id,
        user_id: m.userId,
        role: m.role,
        persona: m.persona,
        model: m.model,
        content: m.content,
        timestamp: m.timestamp
      }));
      const { error } = await client.from('chat_messages').upsert(formattedMessages, { onConflict: 'id' });
      report.tables.push({
        name: 'chat_messages',
        count: formattedMessages.length,
        status: error ? 'failed' : 'transferred',
        error: error?.message,
      });
    }

    const hasFailures = report.tables.some(t => t.status === 'failed');
    report.success = !hasFailures;
    return report;
  } catch (err: any) {
    report.success = false;
    report.tables.push({
      name: 'general',
      count: 0,
      status: 'failed',
      error: err?.message || 'Transfer failed unexpectedly',
    });
    return report;
  }
}
