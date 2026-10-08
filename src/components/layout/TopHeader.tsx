import React from 'react';
import { 
  Search, 
  Sparkles, 
  Plus, 
  Menu, 
  BookMarked,
  Shield,
  CloudCheck,
  CloudOff
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

interface TopHeaderProps {
  onToggleMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileMenu }) => {
  const { 
    activeView, 
    setActiveView, 
    activeSemester, 
    searchQuery, 
    setSearchQuery, 
    setIsQuickAddOpen,
    isDbConnected
  } = useAcademic();

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Left: Mobile Toggle & View Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-800 tracking-wide">
            ILMISTAAN
          </span>
          <span className="text-slate-300 font-mono">/</span>
          <span className="text-slate-500 font-medium hidden sm:inline">
            {activeSemester?.name || 'Fall 2026'}
          </span>
          <span className="text-slate-300 font-mono hidden sm:inline">/</span>
          <span className="text-emerald-700 font-medium capitalize">
            {activeView.replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search subjects, assignments, lecture notes, quizzes... (Ctrl+K)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <kbd className="font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Launch AI Tutor */}
        <button
          onClick={() => setActiveView('tutor')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            activeView === 'tutor'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
          title="Open AI Academic Tutor grounded in your syllabus"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>

        {/* New Entry Action Button */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs active:scale-[0.98]"
          title="Quick Add Assignment, Lecture, or Quiz (N)"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Entry</span>
        </button>
      </div>
    </header>
  );
};
