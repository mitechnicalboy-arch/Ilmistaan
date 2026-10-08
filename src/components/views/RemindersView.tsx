import React from 'react';
import { 
  Bell, 
  AlertCircle, 
  Clock, 
  GraduationCap, 
  Circle, 
  CheckCircle2, 
  Pin,
  ExternalLink 
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { getDeadlineUrgency, getDaysCountdown, formatDate } from '../../utils/dateUtils';

export const RemindersView: React.FC = () => {
  const { 
    activeAssignments, 
    activeQuizzes, 
    activeCourses, 
    toggleAssignmentStatus,
    toggleAssignmentPin,
    setSelectedAssignmentDetail,
    setSelectedQuizDetail
  } = useAcademic();

  // Urgent computations
  const overdueTasks = activeAssignments.filter(a => {
    if (a.status === 'completed') return false;
    const { urgency } = getDeadlineUrgency(a.deadline);
    return urgency === 'overdue';
  });

  const dueTodayTasks = activeAssignments.filter(a => {
    if (a.status === 'completed') return false;
    const { urgency } = getDeadlineUrgency(a.deadline);
    return urgency === 'due_today';
  });

  const upcomingTests = activeQuizzes.filter(q => {
    if (q.status !== 'upcoming') return false;
    const { days, isPast } = getDaysCountdown(q.date);
    return !isPast && days <= 7;
  });

  const allPendingSorted = [...activeAssignments]
    .filter(a => a.status !== 'completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Attention Strip & Reminders Hub
        </h2>
        <p className="text-xs text-slate-500">
          Prioritized action queue sorted by imminent academic due date
        </p>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Overdue Obligations</span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {overdueTasks.length}
          </div>
          <p className="text-[11px] text-rose-600 mt-1">Assignments past official cutoff</p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs mb-1">
            <Clock className="w-4 h-4" />
            <span>Due Today Before Midnight</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
            {dueTodayTasks.length}
          </div>
          <p className="text-[11px] text-amber-600 mt-1">Requires immediate completion</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Imminent Exams (7 Days)</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {upcomingTests.length}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Quizzes and midterms</p>
        </div>
      </div>

      {/* Prioritized Action Queue */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Prioritized Action Queue
        </h3>

        {allPendingSorted.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-700">All current obligations are fulfilled!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allPendingSorted.map(task => {
              const course = activeCourses.find(c => c.id === task.courseId);
              const { urgency, label } = getDeadlineUrgency(task.deadline);

              return (
                <div key={task.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleAssignmentStatus(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 shrink-0"
                    >
                      <Circle className="w-4 h-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => setSelectedAssignmentDetail(task)}
                          className="font-semibold text-slate-900 hover:text-emerald-800 cursor-pointer transition-colors"
                        >
                          {task.title}
                        </span>
                        {task.isPinned && (
                          <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>

                      {/* Zero-Pill Typography Metadata */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap font-mono">
                        <span className="text-slate-800 font-semibold">{course?.code}</span>
                        <span>·</span>
                        <span className={`font-semibold ${
                          urgency === 'overdue' ? 'text-rose-600 font-bold' :
                          urgency === 'due_today' ? 'text-amber-600 font-bold' :
                          'text-emerald-700'
                        }`}>
                          {label} ({formatDate(task.deadline)})
                        </span>
                        <span>·</span>
                        <span className="capitalize">{task.priority} Priority</span>
                      </div>
                    </div>
                  </div>

                  {task.resourceLink && (
                    <a
                      href={task.resourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-slate-400 hover:text-emerald-600 shrink-0"
                      title="Open Resource Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
