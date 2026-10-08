import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  FileText, 
  GraduationCap, 
  Calendar, 
  Bell, 
  Pin, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  User, 
  LogOut, 
  Plus, 
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import crestImage from '../../assets/images/university_portal_crest_1791113487512.jpg';

export const Sidebar: React.FC = () => {
  const { 
    currentUser, 
    activeView, 
    setActiveView, 
    semesters, 
    activeSemesterId, 
    setActiveSemesterId, 
    activeCourses,
    activeAssignments,
    activeQuizzes,
    signOut,
    addSemester,
    deleteSemester,
    requestConfirmation
  } = useAcademic();

  const [isSemesterMenuOpen, setIsSemesterMenuOpen] = useState(false);
  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
  const [newSemName, setNewSemName] = useState('');
  const [newSemYear, setNewSemYear] = useState('2026-2027');
  const [newSemStart, setNewSemStart] = useState('2026-09-01');
  const [newSemEnd, setNewSemEnd] = useState('2027-01-20');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Computed urgent counts
  const pendingAssignmentsCount = activeAssignments.filter(a => a.status !== 'completed').length;
  const upcomingQuizzesCount = activeQuizzes.filter(q => q.status === 'upcoming').length;
  const urgentRemindersCount = pendingAssignmentsCount + upcomingQuizzesCount;

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemName.trim()) return;
    await addSemester({
      name: newSemName.trim(),
      academicYear: newSemYear,
      startDate: newSemStart,
      endDate: newSemEnd,
      status: 'active'
    });
    setNewSemName('');
    setIsAddSemesterOpen(false);
    setIsSemesterMenuOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, count: null },
    { id: 'courses', label: 'Subjects Directory', icon: BookOpen, count: activeCourses.length },
    { id: 'assignments', label: 'Assignments & Tasks', icon: CheckSquare, count: pendingAssignmentsCount },
    { id: 'lectures', label: 'Lecture Notes', icon: FileText, count: null },
    { id: 'quizzes', label: 'Quizzes & Exams', icon: GraduationCap, count: upcomingQuizzesCount },
    { id: 'calendar', label: 'Academic Calendar', icon: Calendar, count: null },
    { id: 'reminders', label: 'Attention & Reminders', icon: Bell, count: urgentRemindersCount > 0 ? urgentRemindersCount : null },
    { id: 'pinned', label: 'Pinned Workspace', icon: Pin, count: null },
    { id: 'trash', label: 'Trash Bin', icon: Trash2, count: null },
    { id: 'tutor', label: 'AI Academic Tutor', icon: Sparkles, count: 'Active' },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Console', icon: ShieldCheck, count: null });
  }

  const activeSemesterObj = semesters.find(s => s.id === activeSemesterId) || semesters[0];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen select-none shrink-0 sticky top-0 z-30">
      {/* Brand Zone */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-emerald-200 shadow-xs shrink-0 bg-emerald-50 flex items-center justify-center">
          <img 
            src={crestImage} 
            alt="University Crest" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold tracking-tight text-slate-900 truncate tracking-wide">
            ILMISTAAN
          </h1>
          <p className="text-[11px] text-slate-500 truncate font-medium">
            Dawoodian's Portal
          </p>
        </div>
      </div>

      {/* Semester Switcher Dropdown */}
      <div className="px-3 py-2.5 border-b border-slate-100 relative">
        <div className="text-[11px] font-medium text-slate-400 px-2 mb-1 flex items-center justify-between">
          <span>ACTIVE SEMESTER</span>
          <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {activeSemesterObj?.status.toUpperCase()}
          </span>
        </div>
        
        <button
          onClick={() => setIsSemesterMenuOpen(!isSemesterMenuOpen)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
        >
          <span className="truncate font-semibold">{activeSemesterObj?.name || 'Fall 2026'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
        </button>

        {isSemesterMenuOpen && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-xs">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-100">
              Switch Term
            </div>
            {semesters.map(sem => (
              <div
                key={sem.id}
                className={`w-full px-3 py-1.5 flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                  sem.id === activeSemesterId ? 'text-emerald-700 font-semibold bg-emerald-50/50' : 'text-slate-700'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveSemesterId(sem.id);
                    setIsSemesterMenuOpen(false);
                  }}
                  className="flex-1 text-left flex items-center justify-between mr-2 cursor-pointer"
                >
                  <span>{sem.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{sem.academicYear}</span>
                </button>
                {currentUser?.role === 'admin' && semesters.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSemesterMenuOpen(false);
                      requestConfirmation({
                        title: 'Admin: Delete Semester',
                        message: `Administrator Authority: Are you sure you want to delete term "${sem.name}"?`,
                        confirmText: 'Delete Term',
                        isAdminAction: true,
                        isDestructive: true,
                        onConfirm: async () => {
                          await deleteSemester(sem.id);
                        }
                      });
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Admin: Delete Semester"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => {
                  setIsSemesterMenuOpen(false);
                  setIsAddSemesterOpen(true);
                }}
                className="w-full text-left px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 font-medium flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Academic Semester</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-2 border-emerald-600 pl-2.5' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.count !== null && (
                <span className={`text-[11px] font-mono tabular-nums ${
                  isActive ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Student Profile Footer & Sign Out */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveView('profile')}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">
                {currentUser?.name || 'Muhammad Irteza'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                {currentUser?.role === 'admin' ? 'Administrator' : 'Student'} · Fall '26
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowSignOutConfirm(true)}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Semester Modal */}
      {isAddSemesterOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Create Academic Semester</h3>
            <p className="text-xs text-slate-500 mb-4">Set up a new semester timeline to track courses and deadlines.</p>
            
            <form onSubmit={handleCreateSemester} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Semester Name</label>
                <input
                  type="text"
                  placeholder="e.g. Spring 2027"
                  value={newSemName}
                  onChange={e => setNewSemName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  placeholder="2026-2027"
                  value={newSemYear}
                  onChange={e => setNewSemYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newSemStart}
                    onChange={e => setNewSemStart(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newSemEnd}
                    onChange={e => setNewSemEnd(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSemesterOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium shadow-xs"
                >
                  Create Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xs p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Confirm Sign Out</h3>
            <p className="text-xs text-slate-500 mb-4">Are you sure you want to end your current session?</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  signOut();
                }}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-md font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
