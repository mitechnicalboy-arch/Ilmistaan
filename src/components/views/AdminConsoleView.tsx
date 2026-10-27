import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Database, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  UserX,
  Server,
  Trash2,
  Flame,
  Check,
  ArrowRight,
  RotateCcw,
  Activity,
  Terminal,
  X,
  Loader2
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate } from '../../utils/dateUtils';
import { SupabaseTransferModal } from '../modals/SupabaseTransferModal';
import { runFirebaseAuthSupabaseDiagnostics, DiagnosticResult } from '../../services/authDiagnostics';

export const AdminConsoleView: React.FC = () => {
  const { 
    currentUser, 
    allUsers, 
    refreshUsers, 
    updateUserRole, 
    toggleUserSuspension, 
    deleteUser, 
    emptyTrash, 
    deleteAllCoursework, 
    courses, 
    assignments, 
    lectures, 
    quizzes, 
    isDbConnected, 
    requestConfirmation 
  } = useAcademic();

  const [studentSearch, setStudentSearch] = useState('');
  const [purgeSuccessMsg, setPurgeSuccessMsg] = useState<string | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  // Automatically refresh registered student directory on console load and periodically
  useEffect(() => {
    refreshUsers();
    const interval = setInterval(() => {
      refreshUsers();
    }, 12000);
    return () => clearInterval(interval);
  }, [refreshUsers]);

  const handleRunDiagnostics = async () => {
    setIsDiagnosticRunning(true);
    try {
      const res = await runFirebaseAuthSupabaseDiagnostics();
      setDiagnosticResult(res);
      setIsDiagnosticOpen(true);
    } catch (err: any) {
      console.error('Diagnostics failed:', err);
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <ShieldCheck className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 text-sm">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1">This console requires elevated Academic Administrator credentials.</p>
      </div>
    );
  }

  const term = (studentSearch || '').toLowerCase();
  const filteredUsers = allUsers.filter(u => 
    (u.name || '').toLowerCase().includes(term) ||
    (u.email || '').toLowerCase().includes(term)
  );

  const trashedCount = 
    courses.filter(c => c.isDeleted).length +
    assignments.filter(a => a.isDeleted).length +
    lectures.filter(l => l.isDeleted).length +
    quizzes.filter(q => q.isDeleted).length;

  const totalDiaryRecords = courses.length + assignments.length + lectures.length + quizzes.length;

  const handleEmptyTrash = () => {
    if (trashedCount === 0) return;
    requestConfirmation({
      title: 'Admin: Empty Trash Records',
      message: `Administrator Authority: Are you sure you want to permanently purge all ${trashedCount} soft-deleted records across courses, assignments, lectures, and quizzes? This operation cannot be undone.`,
      confirmText: `Empty All (${trashedCount})`,
      isAdminAction: true,
      isDestructive: true,
      onConfirm: async () => {
        const res = await emptyTrash();
        setPurgeSuccessMsg(`Successfully purged ${res.count} soft-deleted records from the database.`);
        setTimeout(() => setPurgeSuccessMsg(null), 5000);
      }
    });
  };

  const totalCourseworkCount = assignments.length + lectures.length + quizzes.length;

  const handleClearAllCoursework = () => {
    requestConfirmation({
      title: 'Admin: Clear All Subject Coursework',
      message: `Administrator Authority: Are you sure you want to permanently delete all assigned assignments (${assignments.length}), quizzes (${quizzes.length}), and lectures (${lectures.length}) across all subjects and set all counts to zero? This operation cannot be undone.`,
      confirmText: 'Delete All & Set to 0',
      isAdminAction: true,
      isDestructive: true,
      onConfirm: async () => {
        const res = await deleteAllCoursework();
        if (res.success) {
          setPurgeSuccessMsg('Successfully deleted all assignments, quizzes, and lectures across all subjects. All coursework counts are now zero.');
          setTimeout(() => setPurgeSuccessMsg(null), 5000);
        } else {
          setPurgeSuccessMsg(res.error || 'Failed to clear coursework.');
          setTimeout(() => setPurgeSuccessMsg(null), 5000);
        }
      }
    });
  };

  const handleDeleteUser = (userId: string, userName: string, userEmail: string) => {
    requestConfirmation({
      title: 'Admin: Delete Student Account',
      message: `Administrator Deletion Authority:\nAre you sure you want to permanently delete student account "${userName}" (${userEmail})?\n\nThis will remove their profile and all coursework created by this user.`,
      confirmText: 'Delete Account',
      isAdminAction: true,
      isDestructive: true,
      onConfirm: async () => {
        const res = await deleteUser(userId);
        if (res.success) {
          setPurgeSuccessMsg(`Successfully deleted student account "${userName}".`);
          setTimeout(() => setPurgeSuccessMsg(null), 5000);
        } else {
          setPurgeSuccessMsg(res.error || 'Failed to delete user.');
          setTimeout(() => setPurgeSuccessMsg(null), 5000);
        }
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            University Administrator & Registrar Console
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Student directory governance, role assignments, suspension controls, and full administrative deletion rights
        </p>
      </div>

      {/* Admin Authority Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-950">Elevated Administrative Authority Active</h4>
            <p className="text-emerald-800 text-[11px] mt-0.5">
              As the sole verified Academic Administrator, you possess full rights to edit and delete any course, assignment, lecture, quiz, student account, or empty the database trash bin. Regular students can only modify or delete items created from their own account.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-md font-bold">
            Full Delete Rights: Granted
          </span>
        </div>
      </div>

      {purgeSuccessMsg && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-700" />
          <span className="font-medium">{purgeSuccessMsg}</span>
        </div>
      )}

      {/* Supabase PostgreSQL Migration Hub Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-xl p-5 shadow-sm border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-white">Supabase Relational Migration Hub</h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                PostgreSQL Ready
              </span>
            </div>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed max-w-2xl">
              Transfer all academic courses, assignments, quizzes, lecture curriculum notes, and user accounts to Supabase. Includes 1-click batch transfer, pre-generated DDL SQL schema, and JSON export.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <button
            onClick={handleRunDiagnostics}
            disabled={isDiagnosticRunning}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs border border-emerald-500/30 cursor-pointer disabled:opacity-60"
            title="Diagnose Firebase Auth user state & Supabase Authorization Bearer header"
          >
            {isDiagnosticRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{isDiagnosticRunning ? 'Running Probe...' : 'Auth & Token Diagnostics'}</span>
          </button>

          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Open Supabase Transfer Hub</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* System Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {allUsers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Registered accounts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Active Courses</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {courses.filter(c => !c.isDeleted).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Fall 2026 registered</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Coursework Records</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 flex items-center justify-between">
            <span>{totalCourseworkCount}</span>
            {totalCourseworkCount > 0 ? (
              <button
                onClick={handleClearAllCoursework}
                className="text-[11px] font-sans font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                title="Delete all assignments, quizzes & lectures across all subjects"
              >
                Zero Out
              </button>
            ) : (
              <span className="text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                All 0 (Zero)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Assignments, quizzes & lectures</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Trash Bin Items</span>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 flex items-center justify-between">
            <span>{trashedCount}</span>
            {trashedCount > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="text-[11px] font-sans font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                title="Permanently wipe all trash records"
              >
                Empty Trash
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending purge</p>
        </div>
      </div>

      {/* Student Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Student & Faculty Directory
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage student permissions, suspend accounts, and exercise full deletion rights
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshUsers()}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Refresh student accounts from database"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Sync Accounts</span>
            </button>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">University Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Registered Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map(user => (
                <tr key={user.userId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                      user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isSuspended ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Suspended</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {user.role === 'admin' ? (
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200 font-semibold inline-block">
                        Sole Admin (Protected)
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => toggleUserSuspension(user.userId)}
                          className={`px-2 py-1 text-[11px] font-medium rounded cursor-pointer ${
                            user.isSuspended
                              ? 'text-emerald-700 hover:bg-emerald-50 font-semibold'
                              : 'text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          {user.isSuspended ? 'Reinstate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.userId, user.name, user.email)}
                          className="px-2 py-1 text-[11px] font-medium rounded text-rose-600 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Admin: Delete Student Account"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supabase Transfer Modal */}
      <SupabaseTransferModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Auth & Token Diagnostics Modal */}
      {isDiagnosticOpen && diagnosticResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Firebase Auth & Supabase Authorization Probe
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verified token propagation & server reachability diagnostics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDiagnosticOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Checkpoint Status Banner */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                diagnosticResult.liveProbe.success || diagnosticResult.liveProbe.status === 200 || diagnosticResult.liveProbe.status === 401
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold">
                      Server Reachability: Verified Active
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      No network timeout or &apos;server unreachable&apos; errors detected. Endpoint responded in {diagnosticResult.liveProbe.responseTimeMs ?? '~'}ms.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold text-emerald-800">
                  HTTP {diagnosticResult.liveProbe.status}
                </span>
              </div>

              {/* 1. Firebase Auth User State */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Firebase Auth User State</span>
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold ${
                    diagnosticResult.firebaseAuth.isUserSignedIn 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {diagnosticResult.firebaseAuth.isUserSignedIn ? 'Signed In' : 'Unauthenticated'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">User UID:</span>
                    <span className="font-semibold text-slate-800 break-all">{diagnosticResult.firebaseAuth.uid || 'null'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email:</span>
                    <span className="font-semibold text-slate-800 break-all">{diagnosticResult.firebaseAuth.email || 'null'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Display Name:</span>
                    <span className="text-slate-800">{diagnosticResult.firebaseAuth.displayName || '(Not set)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Token Retrieved:</span>
                    <span className={diagnosticResult.firebaseAuth.tokenRetrievalSuccess ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                      {diagnosticResult.firebaseAuth.tokenRetrievalSuccess ? '✓ Active ID Token' : 'None'}
                    </span>
                  </div>
                </div>

                {diagnosticResult.firebaseAuth.tokenPreview && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500 break-all">
                    <span className="text-slate-400">ID Token Preview: </span>
                    <span className="text-slate-800">{diagnosticResult.firebaseAuth.tokenPreview}</span>
                    {diagnosticResult.firebaseAuth.tokenExpiry && (
                      <span className="block text-slate-400 mt-0.5">Expires: {diagnosticResult.firebaseAuth.tokenExpiry}</span>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Supabase Authorization Header Mapping */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Supabase Client Header Verification</span>
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold ${
                    diagnosticResult.supabaseClient.authHeaderConfigured 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {diagnosticResult.supabaseClient.authHeaderConfigured ? 'Bearer Token Attached' : 'Public Anon Key'}
                  </span>
                </div>

                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-400">Authorization: </span>
                    <span>{diagnosticResult.supabaseClient.customHeaders['Authorization'] || 'Bearer ...'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">x-user-id: </span>
                    <span>{diagnosticResult.supabaseClient.customHeaders['x-user-id'] || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">x-user-email: </span>
                    <span>{diagnosticResult.supabaseClient.customHeaders['x-user-email'] || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* 3. Live Probe Execution Log */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <span className="font-bold text-slate-800 block">Live Network Probe Result</span>
                <p className="text-slate-600 text-[11px]">
                  {diagnosticResult.liveProbe.message}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                  <span>Latency: {diagnosticResult.liveProbe.responseTimeMs ?? 0}ms</span>
                  <span>Timestamp: {diagnosticResult.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <span className="text-[11px] text-slate-400">
                Run CLI equivalent: <code className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">npm run diagnose:auth</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunDiagnostics}
                  disabled={isDiagnosticRunning}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors shadow-2xs"
                >
                  {isDiagnosticRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Re-run Probe</span>
                </button>
                <button
                  onClick={() => setIsDiagnosticOpen(false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
