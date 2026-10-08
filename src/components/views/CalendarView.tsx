import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckSquare, 
  FileText, 
  GraduationCap, 
  X,
  Plus
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate } from '../../utils/dateUtils';

export const CalendarView: React.FC = () => {
  const { 
    activeAssignments, 
    activeLectures, 
    activeQuizzes, 
    activeCourses,
    setIsQuickAddOpen,
    setQuickAddType,
    setSelectedAssignmentDetail,
    setSelectedQuizDetail,
    setSelectedLectureDetail
  } = useAcademic();

  const [currentDate, setCurrentDate] = useState(new Date('2026-10-04T04:27:47-07:00'));
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-04');
  const [calendarMode, setCalendarMode] = useState<'month' | 'week' | 'agenda'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Jump to today
  const handleJumpToToday = () => {
    const today = new Date('2026-10-04T04:27:47-07:00');
    setCurrentDate(today);
    setSelectedDate('2026-10-04');
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Month days computation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Group items for selected day
  const selectedAssignments = activeAssignments.filter(a => a.deadline.startsWith(selectedDate));
  const selectedLectures = activeLectures.filter(l => l.date === selectedDate);
  const selectedQuizzes = activeQuizzes.filter(q => q.date.startsWith(selectedDate));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Academic Calendar & Scheduling
          </h2>
          <p className="text-xs text-slate-500">
            Timetable, lectures, deliverables, and exams for Fall 2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setCalendarMode('month')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                calendarMode === 'month' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => setCalendarMode('agenda')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                calendarMode === 'agenda' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Agenda List
            </button>
          </div>

          <button
            onClick={handleJumpToToday}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {calendarMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            {/* Month Nav */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 font-mono">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-slate-400 py-1 border-b border-slate-100">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading padding */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 bg-slate-50/40 rounded-lg border border-transparent"></div>
              ))}

              {daysArray.map(dayNum => {
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDate === dayStr;
                const isToday = dayStr === '2026-10-04';

                // Items on this day
                const dayAssignments = activeAssignments.filter(a => a.deadline.startsWith(dayStr));
                const dayLectures = activeLectures.filter(l => l.date === dayStr);
                const dayQuizzes = activeQuizzes.filter(q => q.date.startsWith(dayStr));

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDate(dayStr)}
                    className={`h-20 p-1.5 text-left rounded-lg border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                        : isToday
                        ? 'border-emerald-300 bg-white'
                        : 'border-slate-100 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs tabular-nums font-semibold ${
                        isToday ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]' : 'text-slate-800'
                      }`}>
                        {dayNum}
                      </span>
                    </div>

                    {/* Indicators */}
                    <div className="space-y-0.5 w-full overflow-hidden text-[9px]">
                      {dayAssignments.length > 0 && (
                        <div className="truncate text-amber-700 font-semibold bg-amber-50 px-1 rounded flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                          <span className="truncate">{dayAssignments.length} Task</span>
                        </div>
                      )}
                      {dayLectures.length > 0 && (
                        <div className="truncate text-slate-700 bg-slate-100 px-1 rounded flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                          <span className="truncate">{dayLectures.length} Lec</span>
                        </div>
                      )}
                      {dayQuizzes.length > 0 && (
                        <div className="truncate text-rose-700 font-semibold bg-rose-50 px-1 rounded flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                          <span className="truncate">{dayQuizzes.length} Exam</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Col: Inspection Drawer for Clicked Day */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Day Inspection Drawer
                </span>
                <h3 className="font-bold text-sm text-slate-900 font-mono mt-0.5">
                  {formatDate(selectedDate)}
                </h3>
              </div>
              <button
                onClick={() => {
                  setQuickAddType('assignment');
                  setIsQuickAddOpen(true);
                }}
                className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                title="Add item on this date"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedAssignments.length === 0 && selectedLectures.length === 0 && selectedQuizzes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-slate-700">No scheduled activities on this date.</p>
                <p className="text-[11px] text-slate-400 mt-1">Enjoy your study break or log an entry.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs divide-y divide-slate-100">
                {/* Quizzes */}
                {selectedQuizzes.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Examinations ({selectedQuizzes.length})</span>
                    </div>
                    <div className="space-y-2">
                      {selectedQuizzes.map(q => {
                        const course = activeCourses.find(c => c.id === q.courseId);
                        return (
                          <div 
                            key={q.id} 
                            onClick={() => setSelectedQuizDetail(q)}
                            className="p-2.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 hover:border-rose-300 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="font-semibold text-slate-900">{q.title}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {course?.code} · {q.venue} · {q.totalMarks} Marks
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assignments */}
                {selectedAssignments.length > 0 && (
                  <div className="pt-3">
                    <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Assignments Due ({selectedAssignments.length})</span>
                    </div>
                    <div className="space-y-2">
                      {selectedAssignments.map(a => {
                        const course = activeCourses.find(c => c.id === a.courseId);
                        return (
                          <div 
                            key={a.id} 
                            onClick={() => setSelectedAssignmentDetail(a)}
                            className="p-2.5 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 hover:border-amber-300 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="font-semibold text-slate-900">{a.title}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {course?.code} · Priority: {a.priority}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lectures */}
                {selectedLectures.length > 0 && (
                  <div className="pt-3">
                    <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Delivered Lectures ({selectedLectures.length})</span>
                    </div>
                    <div className="space-y-2">
                      {selectedLectures.map(l => {
                        const course = activeCourses.find(c => c.id === l.courseId);
                        return (
                          <div 
                            key={l.id} 
                            onClick={() => setSelectedLectureDetail(l)}
                            className="p-2.5 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/60 hover:border-emerald-300 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="font-semibold text-slate-900">
                              Lec {l.lectureNumber}: {l.topicsCovered}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {course?.code} · {l.instructor}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Agenda Mode */
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Chronological Fall 2026 Academic Agenda</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {activeAssignments.map(a => {
              const course = activeCourses.find(c => c.id === a.courseId);
              return (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] mr-2">
                      {course?.code}
                    </span>
                    <span className="font-semibold text-slate-900">{a.title}</span>
                    <span className="text-slate-400 font-mono text-[11px] ml-2">
                      Due: {formatDate(a.deadline)}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 capitalize">{a.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
