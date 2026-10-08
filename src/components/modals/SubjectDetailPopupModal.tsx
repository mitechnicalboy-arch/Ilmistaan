import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckSquare, 
  FileText, 
  GraduationCap, 
  Calendar, 
  Clock, 
  MapPin, 
  Award, 
  ExternalLink, 
  Circle, 
  CheckCircle2, 
  BookOpen,
  Pin,
  User,
  ArrowLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Lock
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate, formatDateTime, getDeadlineUrgency, getDaysCountdown } from '../../utils/dateUtils';

export const SubjectDetailPopupModal: React.FC = () => {
  const { 
    selectedSubjectPopupCourseId, 
    closeSubjectPopup,
    selectedSubjectPopupTab,
    setSelectedSubjectPopupTab,
    selectedSubjectPopupItem,
    activeCourses,
    activeAssignments,
    activeLectures,
    activeQuizzes,
    toggleAssignmentStatus,
    toggleAssignmentPin,
    toggleQuizPin,
    toggleLecturePin,
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
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Sync with initial item if provided when opening
  useEffect(() => {
    if (selectedSubjectPopupItem) {
      if (selectedSubjectPopupItem.type === 'assignment') {
        setActiveAssignmentId(selectedSubjectPopupItem.id);
      } else if (selectedSubjectPopupItem.type === 'quiz') {
        setActiveQuizId(selectedSubjectPopupItem.id);
      } else if (selectedSubjectPopupItem.type === 'lecture') {
        setActiveLectureId(selectedSubjectPopupItem.id);
      }
    } else {
      setActiveAssignmentId(null);
      setActiveQuizId(null);
      setActiveLectureId(null);
    }
  }, [selectedSubjectPopupCourseId, selectedSubjectPopupItem]);

  if (!selectedSubjectPopupCourseId) return null;

  const course = activeCourses.find(c => c.id === selectedSubjectPopupCourseId);
  if (!course) return null;

  // Filter items for this course
  const courseAssignments = activeAssignments.filter(a => a.courseId === course.id);
  const courseQuizzes = activeQuizzes.filter(q => q.courseId === course.id);
  const courseLectures = activeLectures.filter(l => l.courseId === course.id);

  const displayedAssignments = courseAssignments.filter(a => {
    if (assignmentFilter === 'pending') return a.status !== 'completed';
    if (assignmentFilter === 'completed') return a.status === 'completed';
    return true;
  });

  const selectedAssignment = activeAssignmentId ? courseAssignments.find(a => a.id === activeAssignmentId) : null;
  const selectedQuiz = activeQuizId ? courseQuizzes.find(q => q.id === activeQuizId) : null;
  const selectedLecture = activeLectureId ? courseLectures.find(l => l.id === activeLectureId) : null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSubjectPopup();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Top Header of Subject Popup */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
              {course.code}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {course.name}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span>{course.instructor}</span>
                <span>·</span>
                <span>{course.room}</span>
                <span>·</span>
                <span>{course.creditHours} Credit Hours</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {(currentUser?.role === 'admin' || course.userId === currentUser?.userId) && (
              <button
                onClick={() => {
                  const isAdmin = currentUser?.role === 'admin';
                  requestConfirmation({
                    title: isAdmin ? 'Admin Delete Subject' : 'Delete Subject',
                    message: isAdmin
                      ? `Administrative Authority: Are you sure you want to delete subject "${course.name}" (${course.code})? It will be moved to the trash bin.`
                      : `Are you sure you want to delete subject "${course.name}" (${course.code})?`,
                    confirmText: 'Delete Subject',
                    isAdminAction: isAdmin,
                    isDestructive: true,
                    onConfirm: async () => {
                      await deleteCourse(course.id);
                      closeSubjectPopup();
                    }
                  });
                }}
                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title={currentUser?.role === 'admin' ? "Admin Delete Subject" : "Delete Subject"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Subject</span>
              </button>
            )}

            <button
              onClick={closeSubjectPopup}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Close Subject Popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Popup Subject Tabs Navigation Bar */}
        <div className="flex items-center gap-1 sm:gap-2 px-5 pt-3 pb-1 border-b border-slate-100 bg-white shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              setSelectedSubjectPopupTab('assignments');
              setActiveAssignmentId(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
              selectedSubjectPopupTab === 'assignments'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Assignments Tab ({courseAssignments.length})</span>
          </button>

          <button
            onClick={() => {
              setSelectedSubjectPopupTab('quizzes');
              setActiveQuizId(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
              selectedSubjectPopupTab === 'quizzes'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Quizzes Tab ({courseQuizzes.length})</span>
          </button>

          <button
            onClick={() => {
              setSelectedSubjectPopupTab('lectures');
              setActiveLectureId(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
              selectedSubjectPopupTab === 'lectures'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lectures Tab ({courseLectures.length})</span>
          </button>

          <button
            onClick={() => setSelectedSubjectPopupTab('overview')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
              selectedSubjectPopupTab === 'overview'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Syllabus & Info</span>
          </button>
        </div>

        {/* Popup Scrollable Body Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* ======================================================== */}
          {/* 1. ASSIGNMENTS TAB                                       */}
          {/* ======================================================== */}
          {selectedSubjectPopupTab === 'assignments' && (
            <div>
              {/* DETAILED VIEW: If a particular assignment is clicked */}
              {selectedAssignment ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <button
                      onClick={() => setActiveAssignmentId(null)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to {course.name} Assignments</span>
                    </button>

                    <button
                      onClick={() => toggleAssignmentPin(selectedAssignment.id)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                        selectedAssignment.isPinned 
                          ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                      title={selectedAssignment.isPinned ? "Unpin Assignment" : "Pin Assignment"}
                    >
                      <Pin className={`w-3.5 h-3.5 ${selectedAssignment.isPinned ? 'fill-amber-500' : ''}`} />
                      <span>{selectedAssignment.isPinned ? 'Pinned' : 'Pin'}</span>
                    </button>
                  </div>

                  {/* 1. Assignment Number */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Assignment Number
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg">
                      <span className="font-mono text-xs font-bold text-emerald-900">
                        Assignment #{selectedAssignment.assignmentNumber || 1}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700">
                        ({course.code})
                      </span>
                    </div>
                  </div>

                  {/* 2. Assignment Title */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Assignment Title
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {selectedAssignment.title}
                    </h2>
                  </div>

                  {/* 4. Assignment Date & 5. Deadline Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Assignment Date
                      </span>
                      <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(selectedAssignment.dateAssigned)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Deadline Date
                      </span>
                      <span className={`font-semibold text-xs flex items-center gap-1.5 mt-1 ${
                        getDeadlineUrgency(selectedAssignment.deadline).urgency === 'overdue' ? 'text-rose-600 font-bold' :
                        getDeadlineUrgency(selectedAssignment.deadline).urgency === 'due_today' ? 'text-amber-600 font-bold' :
                        'text-emerald-700'
                      }`}>
                        <Clock className="w-4 h-4" />
                        {formatDate(selectedAssignment.deadline)} ({getDeadlineUrgency(selectedAssignment.deadline).label})
                      </span>
                    </div>
                  </div>

                  {/* 3. Detailed Assignment Description/Details */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Detailed Assignment Description/Details
                    </div>
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal">
                      {selectedAssignment.description || 'No detailed instructions provided for this assignment.'}
                    </div>
                  </div>

                  {/* Attached Reference Material */}
                  {selectedAssignment.resourceLink && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Attached Reference Material
                      </div>
                      <a
                        href={selectedAssignment.resourceLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-medium text-xs break-all p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg w-full"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedAssignment.resourceLink}</span>
                      </a>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAssignmentStatus(selectedAssignment.id)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs ${
                          selectedAssignment.status === 'completed'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {selectedAssignment.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                        <span>{selectedAssignment.status === 'completed' ? 'Mark as Incomplete' : 'Mark as Completed'}</span>
                      </button>

                      {/* Authorization-governed Edit: ADMIN can edit any, USER only their own */}
                      {(currentUser?.role === 'admin' || selectedAssignment.userId === currentUser?.userId) ? (
                        <button
                          onClick={() => {
                            setEditingItem({ type: 'assignment', item: selectedAssignment });
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
                      {(currentUser?.role === 'admin' || selectedAssignment.userId === currentUser?.userId) && (
                        <button
                          onClick={() => {
                            const isAdmin = currentUser?.role === 'admin';
                            requestConfirmation({
                              title: isAdmin ? 'Admin Delete Assignment' : 'Delete Assignment',
                              message: isAdmin
                                ? `Administrative Authority: Are you sure you want to delete assignment "${selectedAssignment.title}"? It will be moved to the trash bin.`
                                : `Are you sure you want to delete your assignment "${selectedAssignment.title}"?`,
                              confirmText: 'Delete Assignment',
                              isAdminAction: isAdmin,
                              isDestructive: true,
                              onConfirm: async () => {
                                await deleteAssignment(selectedAssignment.id);
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
                      className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      Back to List
                    </button>
                  </div>
                </div>
              ) : (
                /* LIST VIEW: All assignments of this subject with assignment numbers */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        All Assignments for {course.name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Click any assignment below to open its full detailed view.
                      </p>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                      <button
                        onClick={() => setAssignmentFilter('all')}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                          assignmentFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                        }`}
                      >
                        All ({courseAssignments.length})
                      </button>
                      <button
                        onClick={() => setAssignmentFilter('pending')}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                          assignmentFilter === 'pending' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => setAssignmentFilter('completed')}
                        className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                          assignmentFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>

                  {displayedAssignments.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      <CheckSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No assignments logged for {course.code}.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {displayedAssignments.map((assign, idx) => {
                        const { urgency, label } = getDeadlineUrgency(assign.deadline);
                        const isCompleted = assign.status === 'completed';
                        const assignNum = assign.assignmentNumber || (idx + 1);

                        return (
                          <div
                            key={assign.id}
                            onClick={() => setActiveAssignmentId(assign.id)}
                            className="py-3 px-2.5 hover:bg-emerald-50/50 rounded-xl transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAssignmentStatus(assign.id);
                                }}
                                className="text-slate-400 hover:text-emerald-600 shrink-0 cursor-pointer"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>

                              {/* Assignment Number */}
                              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
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
                            <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
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

          {/* ======================================================== */}
          {/* 2. QUIZZES TAB                                           */}
          {/* ======================================================== */}
          {selectedSubjectPopupTab === 'quizzes' && (
            <div>
              {/* DETAILED VIEW: If a particular quiz is clicked */}
              {selectedQuiz ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <button
                      onClick={() => setActiveQuizId(null)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to {course.name} Quizzes</span>
                    </button>

                    <button
                      onClick={() => toggleQuizPin(selectedQuiz.id)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                        selectedQuiz.isPinned 
                          ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                      title={selectedQuiz.isPinned ? "Unpin Quiz" : "Pin Quiz"}
                    >
                      <Pin className={`w-3.5 h-3.5 ${selectedQuiz.isPinned ? 'fill-amber-500' : ''}`} />
                      <span>{selectedQuiz.isPinned ? 'Pinned' : 'Pin'}</span>
                    </button>
                  </div>

                  {/* 1. Quiz Number */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Quiz Number
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg">
                      <span className="font-mono text-xs font-bold text-emerald-900">
                        Quiz #{selectedQuiz.quizNumber || 1}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700">
                        ({course.code})
                      </span>
                    </div>
                  </div>

                  {/* 2. Quiz Title */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Quiz Title
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {selectedQuiz.title}
                    </h2>
                  </div>

                  {/* 4. Assigned Date & 5. Deadline Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Assigned Date
                      </span>
                      <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(selectedQuiz.assignedDate || '2026-09-25')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Deadline Date
                      </span>
                      <span className="text-emerald-800 font-semibold text-xs flex items-center gap-1.5 mt-1">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        {formatDateTime(selectedQuiz.date)} ({getDaysCountdown(selectedQuiz.date).label})
                      </span>
                    </div>
                  </div>

                  {/* 3. Detailed Quiz Description/Details */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Detailed Quiz Description/Details
                    </div>
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal">
                      {selectedQuiz.syllabusTopics || 'General syllabus review and preparation scope.'}
                    </div>
                  </div>

                  {/* Venue & Total Marks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Classroom / Examination Venue
                      </span>
                      <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {selectedQuiz.venue}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Assessment Total Marks
                      </span>
                      <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1 font-mono">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {selectedQuiz.totalMarks} Marks
                      </span>
                    </div>
                  </div>

                  {/* Recorded Grade */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-900 block">
                        Recorded Student Grade
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-800">
                        {selectedQuiz.obtainedMarks !== null && selectedQuiz.obtainedMarks !== undefined 
                          ? `${selectedQuiz.obtainedMarks} / ${selectedQuiz.totalMarks} Marks (${Math.round((selectedQuiz.obtainedMarks / selectedQuiz.totalMarks) * 100)}%)` 
                          : 'Pending Evaluation / Not graded yet'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded capitalize ${
                      selectedQuiz.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedQuiz.status}
                    </span>
                  </div>

                  {/* Back and Action buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Authorization-governed Edit: ADMIN can edit any, USER only their own */}
                      {(currentUser?.role === 'admin' || selectedQuiz.userId === currentUser?.userId) ? (
                        <button
                          onClick={() => {
                            setEditingItem({ type: 'quiz', item: selectedQuiz });
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
                      {(currentUser?.role === 'admin' || selectedQuiz.userId === currentUser?.userId) && (
                        <button
                          onClick={() => {
                            const isAdmin = currentUser?.role === 'admin';
                            requestConfirmation({
                              title: isAdmin ? 'Admin Delete Quiz' : 'Delete Quiz',
                              message: isAdmin
                                ? `Administrative Authority: Are you sure you want to delete quiz "${selectedQuiz.title}"? It will be moved to the trash bin.`
                                : `Are you sure you want to delete your quiz "${selectedQuiz.title}"?`,
                              confirmText: 'Delete Quiz',
                              isAdminAction: isAdmin,
                              isDestructive: true,
                              onConfirm: async () => {
                                await deleteQuiz(selectedQuiz.id);
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
                      className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      Back to Quizzes List
                    </button>
                  </div>
                </div>
              ) : (
                /* LIST VIEW: All quizzes with Quiz Numbers */
                <div className="space-y-3">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900">
                      All Scheduled Quizzes for {course.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Click any quiz row to open full assessment details and syllabus coverage.
                    </p>
                  </div>

                  {courseQuizzes.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      <GraduationCap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No quizzes scheduled for {course.code} yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {courseQuizzes.map((quiz, idx) => {
                        const countdown = getDaysCountdown(quiz.date);
                        const quizNum = quiz.quizNumber || (idx + 1);

                        return (
                          <div
                            key={quiz.id}
                            onClick={() => setActiveQuizId(quiz.id)}
                            className="py-3 px-2.5 hover:bg-emerald-50/50 rounded-xl transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Quiz Number */}
                              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
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

                            {/* Dates: Assigned Date & Deadline Date */}
                            <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
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

          {/* ======================================================== */}
          {/* 3. LECTURES TAB                                          */}
          {/* ======================================================== */}
          {selectedSubjectPopupTab === 'lectures' && (
            <div>
              {/* DETAILED VIEW: If a particular lecture is clicked */}
              {selectedLecture ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <button
                      onClick={() => setActiveLectureId(null)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to {course.name} Lectures</span>
                    </button>

                    <button
                      onClick={() => toggleLecturePin(selectedLecture.id)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                        selectedLecture.isPinned 
                          ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold' 
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                      title={selectedLecture.isPinned ? "Unpin Lecture" : "Pin Lecture"}
                    >
                      <Pin className={`w-3.5 h-3.5 ${selectedLecture.isPinned ? 'fill-amber-500' : ''}`} />
                      <span>{selectedLecture.isPinned ? 'Pinned' : 'Pin'}</span>
                    </button>
                  </div>

                  {/* 1. Lecture Number */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Lecture Number
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg">
                      <span className="font-mono text-xs font-bold text-emerald-900">
                        Lecture #{selectedLecture.lectureNumber || 1}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700">
                        ({course.code})
                      </span>
                    </div>
                  </div>

                  {/* 2. Lecture Title */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Lecture Title
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {selectedLecture.title || selectedLecture.topicsCovered}
                    </h2>
                  </div>

                  {/* 4. Lecture Date & Delivering Faculty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Lecture Date
                      </span>
                      <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(selectedLecture.date)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Delivering Faculty
                      </span>
                      <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1 font-sans">
                        <User className="w-4 h-4 text-slate-400" />
                        {selectedLecture.instructor}
                      </span>
                    </div>
                  </div>

                  {/* 3. Complete Lecture Details/Content */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Complete Lecture Details/Content
                    </div>
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal max-h-64 overflow-y-auto">
                      {selectedLecture.conceptsSummary || 'No detailed lecture notes recorded.'}
                    </div>
                  </div>

                  {/* Assigned Homework / Tasks */}
                  {selectedLecture.homeworkTasks && (
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                      <span className="font-bold block mb-1 text-[10px] uppercase">
                        Assigned Homework / Tasks
                      </span>
                      <span>{selectedLecture.homeworkTasks}</span>
                    </div>
                  )}

                  {/* Slides URL */}
                  {selectedLecture.slidesUrl && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Presentation Slides / Handouts
                      </div>
                      <a
                        href={selectedLecture.slidesUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-medium text-xs break-all p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg w-full"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedLecture.slidesUrl}</span>
                      </a>
                    </div>
                  )}

                  {/* Back and Action buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Authorization-governed Edit: ADMIN can edit any, USER only their own */}
                      {(currentUser?.role === 'admin' || selectedLecture.userId === currentUser?.userId) ? (
                        <button
                          onClick={() => {
                            setEditingItem({ type: 'lecture', item: selectedLecture });
                          }}
                          className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          title={currentUser?.role === 'admin' ? "Admin: Edit any lecture" : "Edit your lecture"}
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
                      {(currentUser?.role === 'admin' || selectedLecture.userId === currentUser?.userId) && (
                        <button
                          onClick={() => {
                            const isAdmin = currentUser?.role === 'admin';
                            requestConfirmation({
                              title: isAdmin ? 'Admin Delete Lecture Note' : 'Delete Lecture Note',
                              message: isAdmin
                                ? `Administrative Authority: Are you sure you want to delete lecture "${selectedLecture.title || selectedLecture.topicsCovered}"? It will be moved to the trash bin.`
                                : `Are you sure you want to delete your lecture "${selectedLecture.title || selectedLecture.topicsCovered}"?`,
                              confirmText: 'Delete Lecture',
                              isAdminAction: isAdmin,
                              isDestructive: true,
                              onConfirm: async () => {
                                await deleteLecture(selectedLecture.id);
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
                      className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer font-medium"
                    >
                      Back to Lectures List
                    </button>
                  </div>
                </div>
              ) : (
                /* LIST VIEW: All delivered lectures with Lecture Numbers */
                <div className="space-y-3">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900">
                      All Delivered Lectures for {course.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Click any lecture below to view the core concepts, homework, and handouts.
                    </p>
                  </div>

                  {courseLectures.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No lectures logged for {course.code} yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {courseLectures.map((lec, idx) => {
                        const lecNum = lec.lectureNumber || (idx + 1);

                        return (
                          <div
                            key={lec.id}
                            onClick={() => setActiveLectureId(lec.id)}
                            className="py-3 px-2.5 hover:bg-emerald-50/50 rounded-xl transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Lecture Number */}
                              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
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
                            <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
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

          {/* ======================================================== */}
          {/* 4. SYLLABUS & INFO TAB                                   */}
          {/* ======================================================== */}
          {selectedSubjectPopupTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded">
                      {course.code}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1">
                      {course.name}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                    {course.creditHours} Credit Hours
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200/70">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Course Faculty</span>
                    <span className="font-medium text-slate-800 text-xs">{course.instructor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Classroom / Venue</span>
                    <span className="font-medium text-slate-800 text-xs">{course.room}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Course Syllabus Outline
                </div>
                <p className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl text-slate-700 leading-relaxed text-xs">
                  {course.syllabusSummary || 'Comprehensive curriculum specifications aligned with the higher education board.'}
                </p>
              </div>

              {/* Quick switch tabs preview buttons */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => setSelectedSubjectPopupTab('assignments')}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono font-bold text-slate-700">{courseAssignments.length}</span>
                  </div>
                  <span className="font-semibold text-xs text-slate-800 block">Open Assignments</span>
                </button>

                <button
                  onClick={() => setSelectedSubjectPopupTab('quizzes')}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono font-bold text-slate-700">{courseQuizzes.length}</span>
                  </div>
                  <span className="font-semibold text-xs text-slate-800 block">Open Quizzes</span>
                </button>

                <button
                  onClick={() => setSelectedSubjectPopupTab('lectures')}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 rounded-xl text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="font-mono font-bold text-slate-700">{courseLectures.length}</span>
                  </div>
                  <span className="font-semibold text-xs text-slate-800 block">Open Lectures</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Popup Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-slate-400">
            ILMISTAAN · {course.code} Portal
          </span>
          <button
            onClick={closeSubjectPopup}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
          >
            Close Subject Popup
          </button>
        </div>
      </div>
    </div>
  );
};
