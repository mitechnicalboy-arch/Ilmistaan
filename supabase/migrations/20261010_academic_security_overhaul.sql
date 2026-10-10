-- ============================================================================
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

-- 3.1 Check if current user is the single authorized Academic Administrator
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
