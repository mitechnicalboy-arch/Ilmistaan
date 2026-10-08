import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  Calendar, 
  Sparkles 
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView, activeAssignments } = useAcademic();

  const pendingCount = activeAssignments.filter(a => a.status !== 'completed').length;

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Subjects', icon: BookOpen },
    { id: 'assignments', label: 'Tasks', icon: CheckSquare, badge: pendingCount },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tutor', label: 'AI Tutor', icon: Sparkles },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 flex items-center justify-around z-40 px-2 shadow-lg">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as any)}
            className={`flex flex-col items-center justify-center flex-1 py-1 relative ${
              isActive ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Icon className="w-4 h-4" />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white font-mono text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
