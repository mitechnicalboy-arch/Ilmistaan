import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckSquare, 
  FileText, 
  GraduationCap, 
  Plus, 
  Calendar, 
  Clock, 
  Circle, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight,
  User,
  MapPin,
  Award,
  Pin,
  Edit3,
  Trash2,
  Lock
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate, formatDateTime, getDeadlineUrgency, getDaysCountdown } from '../../utils/dateUtils';
import { Assignment, Quiz, Lecture } from '../../types';

export const CourseDetailHub: React.FC = () => {
  const { 
    selectedCourseId, 
    setSelectedCourseId,
    activeCourses, 
    activeAssignments, 
    activeLectures, 
    activeQuizzes,
    activeHubTab,
    setActiveHubTab,
    setActiveView,
    toggleAssignmentStatus,
    toggleAssignmentPin,
    toggleQuizPin,
    toggleLecturePin,
    setSelectedAssignmentDetail,
    setSelectedQuizDetail,
    setSelectedLectureDetail,
    setIsQuickAddOpen,
    setQuickAddType,
    currentUser,
    setEditingItem,
    deleteCourse,
    deleteAssignment,
    deleteLecture,
    deleteQuiz,
    requestConfirmation
  } = useAcademic();

  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);

  const course = activeCourses.find(c => c.id === selectedCourseId) || activeCourses[0];

  if (!course) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <p className="text-xs">No subject selected.</p>
        <button
          onClick={() => setActiveView('dashboard')}
          className="mt-2 text-emerald-700 underline text-xs font-semibold"
        >
          Return to Subjects Hub
        </button>
      </div>
    );
  }

  const courseAssignments = activeAssignments
    .filter(a => a.courseId === course.id)
    .sort((a, b) => (a.assignmentNumber || 0) - (b.assignmentNumber || 0));

  const courseLectures = activeLectures
    .filter(l => l.courseId === course.id)
    .sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));

  const courseQuizzes = activeQuizzes
    .filter(q => q.courseId === course.id)
    .sort((a, b) => (a.quizNumber || 0) - (b.quizNumber || 0));

  const activeAssignment = courseAssignments.find(a => a.id === activeAssignmentId);
  const activeQuiz = courseQuizzes.find(q => q.id === activeQuizId);
  const activeLecture = courseLectures.find(l => l.id === activeLectureId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Subject Header */}
      <div>
        <button
          onClick={() => setActiveView('dashboard')}
          className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 mb-2.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Subjects</span>
        </button>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                  {course.code}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {course.creditHours} Credit Hours
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {course.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap font-mono">
                <span className="flex items-center gap-1 text-slate-700 font-sans">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{course.instructor}</span>
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="flex items-center gap-1 font-sans">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{course.room}</span>
                </span>
              </div>
            </div>

            {/* Quick Add and Action Buttons */}
            <div className="flex items-center gap-2">
              {(currentUser?.role === 'admin' || course.userId === currentUser?.userId) && (
                <button
                  onClick={() => {
                    const isAdmin = currentUser?.role === 'admin';
                    requestConfirmation({
                      title: isAdmin ? 'Admin Delete Subject' : 'Delete Subject',
                      message: isAdmin
                        ? `Administrative Authority: Are you sure you want to delete course "${course.name}" (${course.code})? It will be moved to the trash bin.`
                        : `Are you sure you want to delete course "${course.name}" (${course.code})?`,
                      confirmText: 'Delete Subject',
                      isAdminAction: isAdmin,
                      isDestructive: true,
                      onConfirm: async () => {
                        await deleteCourse(course.id);
                        setActiveView('courses');
                      }
                    });
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={currentUser?.role === 'admin' ? "Admin Delete Course" : "Delete Course"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Subject</span>
                </button>
              )}

              <button
                onClick={() => {
                  setQuickAddType(
                    activeHubTab === 'quizzes' ? 'quiz' :
                    activeHubTab === 'lectures' ? 'lecture' : 'assignment'
                  );
                  setIsQuickAddOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {activeHubTab === 'quizzes' ? 'Schedule Quiz' :
                   activeHubTab === 'lectures' ? 'Log Lecture' : 'Add Assignment'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 9 Subjects Buttons Bar (Buttons, NOT tabs) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select University Subject (Buttons):</span>
          </span>
          <span className="font-normal text-slate-400 font-mono text-[10px]">9 Courses Registered</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {activeCourses.map(c => {
            const isCurrent = c.id === course.id;
            const pendingCount = activeAssignments.filter(a => a.courseId === c.id && a.status !== 'completed').length;

            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCourseId(c.id);
                  setActiveAssignmentId(null);
                  setActiveQuizId(null);
                  setActiveLectureId(null);
                }}
                className={`p-2 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between min-h-[58px] ${
                  isCurrent
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 text-slate-700 border-slate-200/80'
                }`}
                title={`Switch to ${c.code} - ${c.name}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-mono text-[11px] font-bold ${isCurrent ? 'text-white' : 'text-emerald-800'}`}>
                    {c.code}
                  </span>
                  {pendingCount > 0 && (
                    <span className={`font-mono text-[9px] px-1 py-0.2 rounded-full ${
                      isCurrent ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium truncate w-full mt-1 ${isCurrent ? 'text-emerald-50' : 'text-slate-600'}`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Section Action Buttons (Buttons, NOT tabs) */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          onClick={() => {
            setActiveHubTab('assignments');
            setActiveAssignmentId(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 border cursor-pointer ${
            activeHubTab === 'assignments'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-600/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Assignments Section ({courseAssignments.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveHubTab('quizzes');
            setActiveQuizId(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 border cursor-pointer ${
            activeHubTab === 'quizzes'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-600/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Quizzes Section ({courseQuizzes.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveHubTab('lectures');
            setActiveLectureId(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 border cursor-pointer ${
            activeHubTab === 'lectures'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-600/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Lectures Section ({courseLectures.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveHubTab('overview');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 border cursor-pointer ${
            activeHubTab === 'overview'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-600/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Syllabus & Info</span>
        </button>
      </div>

      {/* SECTION 1: ASSIGNMENTS */}
      {activeHubTab === 'assignments' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          {/* Detailed View if an assignment is selected */}
          {activeAssignment ? (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button
                  onClick={() => setActiveAssignmentId(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to {course.name} Assignments</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAssignmentPin(activeAssignment.id)}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      activeAssignment.isPinned 
                        ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                    title="Pin Assignment"
                  >
                    <Pin className={`w-3.5 h-3.5 ${activeAssignment.isPinned ? 'fill-amber-500' : ''}`} />
                    <span>{activeAssignment.isPinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                </div>
              </div>

              {/* Assignment Detailed View Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded">
                    Assignment #{activeAssignment.assignmentNumber || 1}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {course.code} · {course.name}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {activeAssignment.title}
                </h3>
              </div>

              {/* Assignment Date and Deadline Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Assignment Date
                  </span>
                  <span className="text-slate-800 font-semibold text-sm flex items-center gap-1.5 mt-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDate(activeAssignment.dateAssigned)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Deadline Date
                  </span>
                  <span className={`font-semibold text-sm flex items-center gap-1.5 mt-1 ${
                    activeAssignment.status === 'completed' ? 'text-slate-500' :
                    getDeadlineUrgency(activeAssignment.deadline).urgency === 'overdue' ? 'text-rose-600 font-bold' :
                    getDeadlineUrgency(activeAssignment.deadline).urgency === 'due_today' ? 'text-amber-600 font-bold' :
                    'text-emerald-700'
                  }`}>
                    <Clock className="w-4 h-4" />
                    {formatDate(activeAssignment.deadline)} ({getDeadlineUrgency(activeAssignment.deadline).label})
                  </span>
                </div>
              </div>

              {/* Detailed Assignment Description / Details */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Detailed Assignment Description & Requirements
                </div>
                <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs">
                  {activeAssignment.description || 'No detailed instructions recorded for this assignment.'}
                </div>
              </div>

              {/* Resource link */}
              {activeAssignment.resourceLink && (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Attached Reference Material / Cloud Link
                  </div>
                  <a
                    href={activeAssignment.resourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-medium text-xs break-all p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeAssignment.resourceLink}</span>
                  </a>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAssignmentStatus(activeAssignment.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs ${
                      activeAssignment.status === 'completed'
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {activeAssignment.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Mark as Incomplete</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        <span>Mark as Completed</span>
                      </>
                    )}
                  </button>

                  {/* Authorization-governed Edit: ADMIN can edit any, USER only their own */}
                  {(currentUser?.role === 'admin' || activeAssignment.userId === currentUser?.userId) ? (
                    <button
                      onClick={() => {
                        setEditingItem({ type: 'assignment', item: activeAssignment });
                      }}
                      className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={currentUser?.role === 'admin' ? "Admin: Edit any assignment" : "Edit your assignment"}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1" title="Read only: Created by another student">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Other Student's Post</span>
                    </span>
                  )}

                  {/* Authorization-governed Delete: ADMIN can delete any, USER only their own */}
                  {(currentUser?.role === 'admin' || activeAssignment.userId === currentUser?.userId) && (
                    <button
                      onClick={() => {
                        const isAdmin = currentUser?.role === 'admin';
                        requestConfirmation({
                          title: isAdmin ? 'Admin Delete Assignment' : 'Delete Assignment',
                          message: isAdmin
                            ? `Administrative Authority: Are you sure you want to delete assignment "${activeAssignment.title}"? It will be moved to the trash bin.`
                            : `Are you sure you want to delete your assignment "${activeAssignment.title}"?`,
                          confirmText: 'Delete Assignment',
                          isAdminAction: isAdmin,
                          isDestructive: true,
                          onConfirm: async () => {
                            await deleteAssignment(activeAssignment.id);
                            setActiveAssignmentId(null);
                          }
                        });
                      }}
                      className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={currentUser?.role === 'admin' ? "Admin Delete" : "Delete My Assignment"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setActiveAssignmentId(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Close Detailed View
                </button>
              </div>
            </div>
          ) : (
            /* Assignment List View */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {course.name} — Assignments
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Showing all assignments for {course.code}. Click any assignment to open its detailed view.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuickAddType('assignment');
                    setIsQuickAddOpen(true);
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Assignment</span>
                </button>
              </div>

              {courseAssignments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <CheckSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No assignments logged for {course.code} yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Assignment" to record homework or problem sets.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {courseAssignments.map((assign, idx) => {
                    const { urgency, label } = getDeadlineUrgency(assign.deadline);
                    const isCompleted = assign.status === 'completed';
                    const assignNum = assign.assignmentNumber || (idx + 1);

                    return (
                      <div
                        key={assign.id}
                        className="py-3.5 px-3 hover:bg-emerald-50/40 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs group cursor-pointer"
                        onClick={() => {
                          setActiveAssignmentId(assign.id);
                        }}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAssignmentStatus(assign.id);
                            }}
                            className="text-slate-400 hover:text-emerald-600 shrink-0 transition-colors cursor-pointer"
                            title={isCompleted ? "Mark incomplete" : "Mark completed"}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          {/* Assignment Number */}
                          <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                            Assignment #{assignNum}
                          </span>

                          {/* Assignment Title */}
                          <div className="min-w-0 flex-1">
                            <span className={`font-semibold block truncate ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-emerald-800'
                            }`}>
                              {assign.title}
                            </span>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {assign.description}
                            </p>
                          </div>
                        </div>

                        {/* Dates: Assignment Date & Deadline Date */}
                        <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                          <div className="text-right hidden sm:block">
                            <span className="text-slate-400 block text-[10px]">Assignment Date</span>
                            <span className="text-slate-600">{formatDate(assign.dateAssigned)}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px]">Deadline Date</span>
                            <span className={`font-semibold ${
                              isCompleted ? 'text-slate-400' :
                              urgency === 'overdue' ? 'text-rose-600 font-bold' :
                              urgency === 'due_today' ? 'text-amber-600 font-bold' :
                              'text-emerald-700'
                            }`}>
                              {formatDate(assign.deadline)}
                            </span>
                          </div>

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
      )}

      {/* SECTION 2: QUIZZES */}
      {activeHubTab === 'quizzes' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          {/* Detailed View if a quiz is selected */}
          {activeQuiz ? (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button
                  onClick={() => setActiveQuizId(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to {course.name} Quizzes</span>
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

              {/* Quiz Detailed View Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded">
                    Quiz #{activeQuiz.quizNumber || 1}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {course.code} · {course.name}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {activeQuiz.title}
                </h3>
              </div>

              {/* Assigned Date and Deadline Date */}
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

              {/* Footer Actions */}
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
            /* Quiz List View */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {course.name} — Quizzes & Examinations
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Showing all quizzes for {course.code}. Click any quiz to view full details and topics.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuickAddType('quiz');
                    setIsQuickAddOpen(true);
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Quiz</span>
                </button>
              </div>

              {courseQuizzes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No quizzes scheduled for {course.code} yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "Schedule Quiz" to log upcoming lab tests, midterms, or assessments.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {courseQuizzes.map((quiz, idx) => {
                    const countdown = getDaysCountdown(quiz.date);
                    const quizNum = quiz.quizNumber || (idx + 1);

                    return (
                      <div
                        key={quiz.id}
                        className="py-3.5 px-3 hover:bg-emerald-50/40 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs group cursor-pointer"
                        onClick={() => {
                          setActiveQuizId(quiz.id);
                        }}
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
      )}

      {/* SECTION 3: LECTURES */}
      {activeHubTab === 'lectures' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          {/* Detailed View if a lecture is selected */}
          {activeLecture ? (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button
                  onClick={() => setActiveLectureId(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to {course.name} Lectures</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLecturePin(activeLecture.id)}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      activeLecture.isPinned 
                        ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                    title="Pin Lecture"
                  >
                    <Pin className={`w-3.5 h-3.5 ${activeLecture.isPinned ? 'fill-amber-500' : ''}`} />
                    <span>{activeLecture.isPinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                </div>
              </div>

              {/* Lecture Detailed View Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded">
                    Lecture #{activeLecture.lectureNumber || 1}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {course.code} · {course.name}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {activeLecture.title || activeLecture.topicsCovered}
                </h3>
              </div>

              {/* Lecture Date and Instructor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Lecture Date
                  </span>
                  <span className="text-slate-800 font-semibold text-sm flex items-center gap-1.5 mt-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDate(activeLecture.date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Delivering Faculty
                  </span>
                  <span className="text-slate-800 font-semibold text-sm flex items-center gap-1.5 mt-1 font-sans">
                    <User className="w-4 h-4 text-slate-400" />
                    {activeLecture.instructor}
                  </span>
                </div>
              </div>

              {/* Complete Lecture Details / Content */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Complete Lecture Details/Content
                </div>
                <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs max-h-72 overflow-y-auto">
                  {activeLecture.conceptsSummary || 'No extended lecture notes recorded.'}
                </div>
              </div>

              {/* Homework Tasks */}
              {activeLecture.homeworkTasks && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                  <span className="font-semibold block mb-1 text-[10px] uppercase">Assigned Classroom Tasks & Follow-up</span>
                  <span>{activeLecture.homeworkTasks}</span>
                </div>
              )}

              {/* Presentation Slides Link */}
              {activeLecture.slidesUrl && (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Presentation Slides / Handouts
                  </div>
                  <a
                    href={activeLecture.slidesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-medium text-xs break-all p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeLecture.slidesUrl}</span>
                  </a>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Authorization-governed Edit: ADMIN can edit any, USER only their own */}
                  {(currentUser?.role === 'admin' || activeLecture.userId === currentUser?.userId) ? (
                    <button
                      onClick={() => {
                        setEditingItem({ type: 'lecture', item: activeLecture });
                      }}
                      className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={currentUser?.role === 'admin' ? "Admin: Edit any lecture" : "Edit your lecture note"}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Lecture</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded-md flex items-center gap-1" title="Read only: Created by another student">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Other Student's Lecture Note</span>
                    </span>
                  )}

                  {/* Authorization-governed Delete: ADMIN can delete any, USER only their own */}
                  {(currentUser?.role === 'admin' || activeLecture.userId === currentUser?.userId) && (
                    <button
                      onClick={() => {
                        const isAdmin = currentUser?.role === 'admin';
                        requestConfirmation({
                          title: isAdmin ? 'Admin Delete Lecture Note' : 'Delete Lecture Note',
                          message: isAdmin
                            ? `Administrative Authority: Are you sure you want to delete lecture "${activeLecture.title || activeLecture.topicsCovered}"? It will be moved to the trash bin.`
                            : `Are you sure you want to delete your lecture "${activeLecture.title || activeLecture.topicsCovered}"?`,
                          confirmText: 'Delete Lecture',
                          isAdminAction: isAdmin,
                          isDestructive: true,
                          onConfirm: async () => {
                            await deleteLecture(activeLecture.id);
                            setActiveLectureId(null);
                          }
                        });
                      }}
                      className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={currentUser?.role === 'admin' ? "Admin Delete" : "Delete My Lecture"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setActiveLectureId(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Close Detailed View
                </button>
              </div>
            </div>
          ) : (
            /* Lecture List View */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {course.name} — Lectures & Study Notes
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Showing all delivered lectures for {course.code}. Click any lecture to open its complete content.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuickAddType('lecture');
                    setIsQuickAddOpen(true);
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Lecture</span>
                </button>
              </div>

              {courseLectures.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No lecture notes catalogued for {course.code} yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "Log Lecture" to save class notes, formulas, and homework.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {courseLectures.map((lec, idx) => {
                    const lecNum = lec.lectureNumber || (idx + 1);

                    return (
                      <div
                        key={lec.id}
                        className="py-3.5 px-3 hover:bg-emerald-50/40 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs group cursor-pointer"
                        onClick={() => {
                          setActiveLectureId(lec.id);
                        }}
                      >
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          {/* Lecture Number */}
                          <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                            Lecture #{lecNum}
                          </span>

                          {/* Lecture Title */}
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-900 block truncate group-hover:text-emerald-800">
                              {lec.title || lec.topicsCovered}
                            </span>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {lec.conceptsSummary}
                            </p>
                          </div>
                        </div>

                        {/* Lecture Date */}
                        <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px]">Lecture Date</span>
                            <span className="text-slate-700 font-semibold">{formatDate(lec.date)}</span>
                          </div>

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
      )}

      {/* SECTION 4: OVERVIEW & SYLLABUS */}
      {activeHubTab === 'overview' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-5 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Syllabus Summary & Course Outline
            </h3>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {course.syllabusSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div 
              onClick={() => {
                setActiveHubTab('assignments');
                setActiveAssignmentId(null);
              }}
              className="p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <span className="font-mono text-base font-bold text-slate-900">{courseAssignments.length}</span>
              </div>
              <h4 className="font-bold text-slate-900">Assignments</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">View all problem sets and submission dates</p>
            </div>

            <div 
              onClick={() => {
                setActiveHubTab('quizzes');
                setActiveQuizId(null);
              }}
              className="p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span className="font-mono text-base font-bold text-slate-900">{courseQuizzes.length}</span>
              </div>
              <h4 className="font-bold text-slate-900">Quizzes & Exams</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Review test dates, venues, and syllabus scope</p>
            </div>

            <div 
              onClick={() => {
                setActiveHubTab('lectures');
                setActiveLectureId(null);
              }}
              className="p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span className="font-mono text-base font-bold text-slate-900">{courseLectures.length}</span>
              </div>
              <h4 className="font-bold text-slate-900">Lectures</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Access delivered curriculum and study notes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
