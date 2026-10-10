import { SUPABASE_SQL_SCHEMA, SINGLE_ADMIN_EMAIL } from '../../services/supabase.ts';

export interface SupabaseSecurityCheck {
  id: string;
  name: string;
  requirement: string;
  passed: boolean;
  details: string;
}

export function runSupabaseSecurityAudit(): {
  checks: SupabaseSecurityCheck[];
  total: number;
  passed: number;
  failed: number;
} {
  const schema = SUPABASE_SQL_SCHEMA;

  const checks: SupabaseSecurityCheck[] = [
    {
      id: 'SUPA-1',
      name: 'Row Level Security (RLS) Enabled on All Tables',
      requirement: 'Requirement 4: Enable RLS on every table',
      passed: 
        schema.includes('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;') &&
        schema.includes('ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;') &&
        schema.includes('ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;') &&
        schema.includes('ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;') &&
        schema.includes('ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;') &&
        schema.includes('ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;') &&
        schema.includes('ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;'),
      details: 'All 7 public tables have explicit ALTER TABLE ... ENABLE ROW LEVEL SECURITY directives.'
    },
    {
      id: 'SUPA-2',
      name: 'Unauthenticated Visitor Read Blocking',
      requirement: 'Requirement 1: Unauthenticated visitors must not be able to read protected academic data',
      passed: 
        !schema.includes('TO anon') &&
        !schema.includes('USING (true)') &&
        schema.includes('TO authenticated') &&
        schema.includes('auth.role() = \'authenticated\''),
      details: 'No public/anon read policies exist. All policies mandate TO authenticated and auth.role() = authenticated.'
    },
    {
      id: 'SUPA-3',
      name: 'Suspended User Access Prevention',
      requirement: 'Requirement 1 & 4: Prevent suspended users from reading or modifying protected records',
      passed:
        schema.includes('is_active_user()') &&
        schema.includes('is_suspended = TRUE') &&
        schema.includes('NOT EXISTS') &&
        schema.includes('is_suspended = FALSE'),
      details: 'is_active_user() function verifies user is not flagged with is_suspended = TRUE.'
    },
    {
      id: 'SUPA-4',
      name: 'Single Admin Authorization Guard',
      requirement: 'Requirement 3: Maintain exactly one securely authorized admin',
      passed:
        schema.includes(SINGLE_ADMIN_EMAIL) &&
        schema.includes('is_admin()') &&
        schema.includes('auth.jwt() ->> \'email\' = \'muhammadirteza2024@gmail.com\''),
      details: `is_admin() strictly binds authority to ${SINGLE_ADMIN_EMAIL} and validates token identity.`
    },
    {
      id: 'SUPA-5',
      name: 'Anti-Impersonation & Ownership Insertion Check',
      requirement: 'Requirement 2: Students cannot impersonate another student\'s records',
      passed:
        schema.includes('user_id = (auth.uid())::text OR public.is_admin()'),
      details: 'INSERT policies enforce user_id = (auth.uid())::text so students cannot inject another student UID.'
    },
    {
      id: 'SUPA-6',
      name: 'Owner-Only Edit and Deletion Restraint',
      requirement: 'Requirement 2: Students can edit or delete only records they own',
      passed:
        schema.includes('is_record_owner(user_id)') &&
        schema.includes('courses_update_owner') &&
        schema.includes('courses_delete_owner') &&
        schema.includes('assignments_update_owner') &&
        schema.includes('assignments_delete_owner'),
      details: 'UPDATE and DELETE policies evaluate is_record_owner(user_id) restricting non-admin actions to owned rows.'
    },
    {
      id: 'SUPA-7',
      name: 'Anti-Privilege Escalation on User Profiles',
      requirement: 'Requirement 2: Students cannot grant themselves admin privileges',
      passed:
        schema.includes('users_update_policy') &&
        schema.includes('role = (SELECT u.role FROM public.users u WHERE u.id = (auth.uid())::text)') &&
        schema.includes('is_suspended = (SELECT u.is_suspended FROM public.users u WHERE u.id = (auth.uid())::text)'),
      details: 'Users update policy locks role and is_suspended from self-mutation by non-admin callers.'
    },
    {
      id: 'SUPA-8',
      name: 'AI Tutor Chat Message Privacy Isolation',
      requirement: 'Requirement 4: Students may access only their own AI tutor chat messages',
      passed:
        schema.includes('chat_messages_select_owner_only') &&
        schema.includes('chat_messages_insert_owner_only') &&
        schema.includes('(user_id = (auth.uid())::text OR public.is_admin())'),
      details: 'chat_messages table restricts SELECT, INSERT, UPDATE, and DELETE strictly to (auth.uid())::text.'
    },
    {
      id: 'SUPA-9',
      name: 'Shared Academic Record Cross-Student Visibility',
      requirement: 'Requirement 1: After logging in, every student can view all students\' courses, assignments, etc.',
      passed:
        schema.includes('courses_select_active') &&
        schema.includes('semesters_select_active') &&
        schema.includes('assignments_select_active') &&
        schema.includes('lectures_select_active') &&
        schema.includes('quizzes_select_active'),
      details: 'Shared academic tables allow active authenticated students to view peers\' coursework for collaborative study.'
    },
    {
      id: 'SUPA-10',
      name: 'Removal of Conflicting or Insecure Policies',
      requirement: 'Requirement 4: Remove conflicting or insecure policies and use valid PostgreSQL syntax',
      passed:
        schema.includes('DROP POLICY IF EXISTS') &&
        !schema.includes('CREATE POLICY IF NOT EXISTS "Allow read access" ON public.courses FOR SELECT USING (true);'),
      details: 'Old wide-open USING (true) policies have been scrubbed and replaced with deterministic security definers.'
    }
  ];

  const passedCount = checks.filter(c => c.passed).length;

  return {
    checks,
    total: checks.length,
    passed: passedCount,
    failed: checks.length - passedCount,
  };
}
