import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  Clock, 
  ChevronRight,
  Sparkles,
  ArrowLeft,
  MapPin,
  Award,
  Pin,
  Edit3,
  Trash2,
  Lock
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate, formatDateTime, getDaysCountdown } from '../../utils/dateUtils';
import { Quiz } from '../../types';

export const QuizzesView: React.FC = () => {
  const { 
    activeQuizzes, 
    activeCourses, 
    toggleQuizPin,
    setSelectedQuizDetail,
    setActiveView,
    setIsQuickAddOpen,
    setQuickAddType,
    currentUser,
    setEditingItem,
    deleteQuiz,
    requestConfirmation
  } = useAcademic();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeCourses[0]?.id || '');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  const selectedCourse = activeCourses.find(c => c.id === selectedSubjectId) || activeCourses[0];

  const subjectQuizzes = activeQuizzes
    .filter(q => q.courseId === selectedSubjectId)
    .sort((a, b) => (a.quizNumber || 0) - (b.quizNumber || 0));

  const activeQuiz = subjectQuizzes.find(q => q.id === activeQuizId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Quizzes & Examinations by Subject
          </h2>
          <p className="text-xs text-slate-500">
            Select a subject to view all scheduled quizzes, assigned dates, and deadlines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('tutor')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Generate Mock Quiz</span>
          </button>
          <button
            onClick={() => {
              setQuickAddType('quiz');
              setIsQuickAddOpen(true);
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Quiz</span>
          </button>
        </div>
      </div>

      {/* 9 Subjects Buttons Grid (Buttons, NOT tabs) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-700">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select University Subject (Buttons):</span>
          </span>
          <span className="font-normal text-slate-400 font-mono text-[10px]">9 Courses Registered</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeCourses.map(course => {
            const isSelected = course.id === selectedSubjectId;
            const quizCount = activeQuizzes.filter(q => q.courseId === course.id).length;
            const upcomingCount = activeQuizzes.filter(q => q.courseId === course.id && q.status !== 'completed').length;

            return (
              <button
                key={course.id}
                onClick={() => {
                  setSelectedSubjectId(course.id);
                  setActiveQuizId(null);
                }}
                className={`p-3 rounded-xl text-left transition-all border cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 text-slate-700 border-slate-200/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {course.code}
                    </span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {course.creditHours} CH
                    </span>
                  </div>
                  <div className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {course.name}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-mono text-xs font-bold block ${
                    isSelected ? 'text-white' : 'text-slate-800'
                  }`}>
                    {quizCount} Total
                  </span>
                  <span className={`text-[10px] font-mono block ${
                    isSelected ? 'text-emerald-100' : upcomingCount > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                  }`}>
                    {upcomingCount} Upcoming
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Quizzes Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        {/* If a quiz is clicked, open the detailed view */}
        {activeQuiz ? (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setActiveQuizId(null)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {selectedCourse?.name} Quizzes</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleQuizPin(activeQuiz.id)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                    activeQuiz.isPinned 
                      ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                  title="Pin Quiz"
                >
                  <Pin className={`w-3.5 h-3.5 ${activeQuiz.isPinned ? 'fill-amber-500' : ''}`} />
                  <span>{activeQuiz.isPinned ? 'Pinned' : 'Pin'}</span>
                </button>
              </div>
            </div>

            {/* Quiz Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded">
                  Quiz #{activeQuiz.quizNumber || 1}
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {selectedCourse?.code} · {selectedCourse?.name}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {activeQuiz.title}
              </h3>
            </div>

            {/* Date Grid: Assigned Date & Deadline / Exam Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Assigned Date
                </span>
                <span className="text-slate-800 font-semibold text-sm flex items-center gap-1.5 mt-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {formatDate(activeQuiz.assignedDate || '2026-09-25')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Deadline Date
                </span>
                <span className="text-emerald-800 font-semibold text-sm flex items-center gap-1.5 mt-1">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {formatDateTime(activeQuiz.date)} ({getDaysCountdown(activeQuiz.date).label})
                </span>
              </div>
            </div>

            {/* Venue & Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Classroom / Examination Venue</span>
                <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {activeQuiz.venue}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assessment Total Marks</span>
                <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1 font-mono">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {activeQuiz.totalMarks} Marks
                </span>
              </div>
            </div>

            {/* Detailed Quiz Description / Syllabus Topics */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Detailed Quiz Description/Details
              </div>
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs">
                {activeQuiz.syllabusTopics || 'General syllabus review and preparation scope.'}
              </div>
            </div>

            {/* Recorded Grade */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase text-emerald-900 block">Recorded Student Grade</span>
                <span className="font-mono text-xs font-bold text-emerald-800">
                  {activeQuiz.obtainedMarks !== null && activeQuiz.obtainedMarks !== undefined 
                    ? `${activeQuiz.obtainedMarks} / ${activeQuiz.totalMarks} Marks (${Math.round((activeQuiz.obtainedMarks / activeQuiz.totalMarks) * 100)}%)` 
                    : 'Pending Evaluation / Not graded yet'}
                </span>
              </div>
              <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded capitalize ${
                activeQuiz.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {activeQuiz.status}
              </span>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Authorization-governed Edit: ADMIN can edit any, USER only their own */}
                {(currentUser?.role === 'admin' || activeQuiz.userId === currentUser?.userId) ? (
                  <button
                    onClick={() => {
                      setEditingItem({ type: 'quiz', item: activeQuiz });
                    }}
                    className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={currentUser?.role === 'admin' ? "Admin: Edit any quiz" : "Edit your quiz"}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Quiz</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1" title="Read only: Created by another student">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Other Student's Entry</span>
                  </span>
                )}

                {/* Authorization-governed Delete: ADMIN can delete any, USER only their own */}
                {(currentUser?.role === 'admin' || activeQuiz.userId === currentUser?.userId) && (
                  <button
                    onClick={() => {
                      const isAdmin = currentUser?.role === 'admin';
                      requestConfirmation({
                        title: isAdmin ? 'Admin Delete Quiz' : 'Delete Quiz',
                        message: isAdmin
                          ? `Administrative Authority: Are you sure you want to delete quiz "${activeQuiz.title}"? It will be moved to the trash bin.`
                          : `Are you sure you want to delete your quiz "${activeQuiz.title}"?`,
                        confirmText: 'Delete Quiz',
                        isAdminAction: isAdmin,
                        isDestructive: true,
                        onConfirm: async () => {
                          await deleteQuiz(activeQuiz.id);
                          setActiveQuizId(null);
                        }
                      });
                    }}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={currentUser?.role === 'admin' ? "Admin Delete" : "Delete My Quiz"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveQuizId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Close Detailed View
              </button>
            </div>
          </div>
        ) : (
          /* Quiz List for Selected Subject */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {selectedCourse?.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedCourse?.name} — Scheduled Quizzes
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Showing quizzes organized for {selectedCourse?.name}. Click any row to open the detailed view.
                </p>
              </div>

              <span className="font-mono text-xs text-slate-400">
                {subjectQuizzes.length} Quizzes Scheduled
              </span>
            </div>

            {subjectQuizzes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No quizzes scheduled for {selectedCourse?.name}.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Schedule Quiz" to log upcoming lab tests, midterms, or assessments.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subjectQuizzes.map((quiz, idx) => {
                  const countdown = getDaysCountdown(quiz.date);
                  const quizNum = quiz.quizNumber || (idx + 1);

                  return (
                    <div
                      key={quiz.id}
                      onClick={() => {
                        setActiveQuizId(quiz.id);
                      }}
                      className="py-3.5 px-3 hover:bg-emerald-50/40 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Quiz Number */}
                        <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                          Quiz #{quizNum}
                        </span>

                        {/* Quiz Title */}
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-900 block truncate group-hover:text-emerald-800">
                            {quiz.title}
                          </span>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Syllabus: {quiz.syllabusTopics}
                          </p>
                        </div>
                      </div>

                      {/* Dates: Assigned Date & Deadline / Exam Date */}
                      <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                        <div className="text-right hidden sm:block">
                          <span className="text-slate-400 block text-[10px]">Assigned Date</span>
                          <span className="text-slate-600">{formatDate(quiz.assignedDate || '2026-09-25')}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Deadline Date</span>
                          <span className={`font-semibold ${
                            quiz.status === 'completed' ? 'text-slate-500' :
                            countdown.days <= 3 ? 'text-rose-600 font-bold' :
                            'text-emerald-700'
                          }`}>
                            {formatDateTime(quiz.date)}
                          </span>
                        </div>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          quiz.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {quiz.status === 'completed' ? 'Completed' : countdown.label}
                        </span>

                        {(currentUser?.role === 'admin' || quiz.userId === currentUser?.userId) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isAdmin = currentUser?.role === 'admin';
                              requestConfirmation({
                                title: isAdmin ? 'Admin Delete Quiz' : 'Delete Quiz',
                                message: isAdmin
                                  ? `Administrative Authority: Are you sure you want to delete quiz "${quiz.title}"? It will be moved to the trash bin.`
                                  : `Are you sure you want to delete your quiz "${quiz.title}"?`,
                                confirmText: 'Delete Quiz',
                                isAdminAction: isAdmin,
                                isDestructive: true,
                                onConfirm: async () => {
                                  await deleteQuiz(quiz.id);
                                }
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                            title={currentUser?.role === 'admin' ? "Admin Delete Quiz" : "Delete My Quiz"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
