import React, { useState } from 'react';
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
  Info,
  Edit3,
  Trash2,
  Shield,
  Lock
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate, formatDateTime, getDeadlineUrgency, getDaysCountdown } from '../../utils/dateUtils';

type DetailModalTab = 'details' | 'subject';

export const ItemDetailModal: React.FC = () => {
  const { 
    selectedAssignmentDetail, 
    setSelectedAssignmentDetail,
    selectedQuizDetail,
    setSelectedQuizDetail,
    selectedLectureDetail,
    setSelectedLectureDetail,
    activeCourses,
    toggleAssignmentStatus,
    toggleAssignmentPin,
    toggleQuizPin,
    toggleLecturePin,
    currentUser,
    setEditingItem,
    deleteAssignment,
    deleteLecture,
    deleteQuiz,
    requestConfirmation
  } = useAcademic();

  const [activeModalTab, setActiveModalTab] = useState<DetailModalTab>('details');

  // Close all handlers
  const handleClose = () => {
    setSelectedAssignmentDetail(null);
    setSelectedQuizDetail(null);
    setSelectedLectureDetail(null);
    setActiveModalTab('details');
  };

  /* -------------------------------------------------------------
     1. ASSIGNMENT POP-UP DETAILED TAB MODAL
     ------------------------------------------------------------- */
  if (selectedAssignmentDetail) {
    const a = selectedAssignmentDetail;
    const course = activeCourses.find(c => c.id === a.courseId);
    const { urgency, label } = getDeadlineUrgency(a.deadline);
    const isCompleted = a.status === 'completed';

    return (
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
          {/* Pop-up Header */}
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded">
                {course?.code || 'ACAD'}
              </span>
              <span className="font-semibold text-xs text-slate-800 truncate max-w-[260px] sm:max-w-xs">
                {course?.name || 'Academic Course'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleAssignmentPin(a.id)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  a.isPinned 
                    ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold' 
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                }`}
                title={a.isPinned ? "Unpin Assignment" : "Pin Assignment"}
              >
                <Pin className={`w-3.5 h-3.5 ${a.isPinned ? 'fill-amber-500' : ''}`} />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close Pop-up"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pop-up Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-slate-100 bg-white shrink-0">
            <button
              onClick={() => setActiveModalTab('details')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeModalTab === 'details'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Assignment Details Tab</span>
            </button>
            <button
              onClick={() => setActiveModalTab('subject')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeModalTab === 'subject'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Subject & Faculty Info</span>
            </button>
          </div>

          {/* Pop-up Body: Scrollable */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
            {activeModalTab === 'details' ? (
              <>
                {/* 1. Assignment Number */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Assignment Number
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg">
                    <span className="font-mono text-xs font-bold text-emerald-900">
                      Assignment #{a.assignmentNumber || 1}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700">
                      ({course?.code})
                    </span>
                  </div>
                </div>

                {/* 2. Assignment Title */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Assignment Title
                  </div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {a.title}
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
                      {formatDate(a.dateAssigned)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Deadline Date
                    </span>
                    <span className={`font-semibold text-xs flex items-center gap-1.5 mt-1 ${
                      urgency === 'overdue' ? 'text-rose-600 font-bold' :
                      urgency === 'due_today' ? 'text-amber-600 font-bold' :
                      'text-emerald-700'
                    }`}>
                      <Clock className="w-4 h-4" />
                      {formatDate(a.deadline)} ({label})
                    </span>
                  </div>
                </div>

                {/* 3. Detailed Assignment Description/Details */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Detailed Assignment Description/Details
                  </div>
                  <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal">
                    {a.description || 'No detailed instructions provided for this assignment.'}
                  </div>
                </div>

                {/* Attached Reference Material */}
                {a.resourceLink && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Attached Reference Material
                    </div>
                    <a
                      href={a.resourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-medium text-xs break-all p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg w-full"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>{a.resourceLink}</span>
                    </a>
                  </div>
                )}
              </>
            ) : (
              /* Tab 2: Subject & Faculty Info */
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                        {course?.code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">
                        {course?.name}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {course?.creditHours} Credit Hours
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Faculty Instructor</span>
                      <span className="font-medium text-slate-800">{course?.instructor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Classroom / Room</span>
                      <span className="font-medium text-slate-800">{course?.room}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Course Syllabus Outline
                  </div>
                  <p className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl text-slate-700 leading-relaxed text-xs">
                    {course?.syllabusSummary || 'Comprehensive curriculum aligned with higher education degree specifications.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pop-up Footer Action */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toggleAssignmentStatus(a.id);
                  setSelectedAssignmentDetail({
                    ...a,
                    status: a.status === 'completed' ? 'pending' : 'completed'
                  });
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer ${
                  isCompleted 
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4" />}
                <span>{isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}</span>
              </button>

              {/* Authorization-governed Edit Button: ADMIN can edit all, USER only own */}
              {(currentUser?.role === 'admin' || a.userId === currentUser?.userId) ? (
                <button
                  onClick={() => {
                    setEditingItem({ type: 'assignment', item: a });
                    handleClose();
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

              {/* Authorization-governed Delete Button: ADMIN can delete all, USER only own */}
              {(currentUser?.role === 'admin' || a.userId === currentUser?.userId) && (
                <button
                  onClick={() => {
                    const isAdmin = currentUser?.role === 'admin';
                    requestConfirmation({
                      title: isAdmin ? 'Admin Delete Assignment' : 'Delete Assignment',
                      message: isAdmin
                        ? `Administrative Authority: Are you sure you want to delete assignment "${a.title}"? It will be moved to the trash bin.`
                        : `Are you sure you want to delete your assignment "${a.title}"?`,
                      confirmText: 'Delete Assignment',
                      isAdminAction: isAdmin,
                      isDestructive: true,
                      onConfirm: async () => {
                        await deleteAssignment(a.id);
                        handleClose();
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
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
            >
              Close Pop-up
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     2. QUIZ POP-UP DETAILED TAB MODAL
     ------------------------------------------------------------- */
  if (selectedQuizDetail) {
    const q = selectedQuizDetail;
    const course = activeCourses.find(c => c.id === q.courseId);
    const countdown = getDaysCountdown(q.date);

    return (
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
          {/* Pop-up Header */}
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded">
                {course?.code || 'ACAD'}
              </span>
              <span className="font-semibold text-xs text-slate-800 truncate max-w-[260px] sm:max-w-xs">
                {course?.name || 'Academic Course'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleQuizPin(q.id)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  q.isPinned 
                    ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold' 
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                }`}
                title={q.isPinned ? "Unpin Quiz" : "Pin Quiz"}
              >
                <Pin className={`w-3.5 h-3.5 ${q.isPinned ? 'fill-amber-500' : ''}`} />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close Pop-up"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pop-up Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-slate-100 bg-white shrink-0">
            <button
              onClick={() => setActiveModalTab('details')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeModalTab === 'details'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Quiz Details Tab</span>
            </button>
            <button
              onClick={() => setActiveModalTab('subject')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeModalTab === 'subject'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Subject & Faculty Info</span>
            </button>
          </div>

          {/* Pop-up Body: Scrollable */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
            {activeModalTab === 'details' ? (
              <>
                {/* 1. Quiz Number */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Quiz Number
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg">
                    <span className="font-mono text-xs font-bold text-emerald-900">
                      Quiz #{q.quizNumber || 1}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700">
                      ({course?.code})
                    </span>
                  </div>
                </div>

                {/* 2. Quiz Title */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Quiz Title
                  </div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {q.title}
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
                      {formatDate(q.assignedDate || '2026-09-25')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Deadline Date
                    </span>
                    <span className="text-emerald-800 font-semibold text-xs flex items-center gap-1.5 mt-1">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      {formatDateTime(q.date)} ({countdown.label})
                    </span>
                  </div>
                </div>

                {/* 3. Detailed Quiz Description/Details */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Detailed Quiz Description/Details
                  </div>
                  <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal">
                    {q.syllabusTopics || 'General syllabus review and preparation scope.'}
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
                      {q.venue}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Assessment Total Marks
                    </span>
                    <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1 font-mono">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {q.totalMarks} Marks
                    </span>
                  </div>
                </div>

                {/* Score Result */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-900 block">
                      Recorded Student Grade
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-800">
                      {q.obtainedMarks !== null && q.obtainedMarks !== undefined 
                        ? `${q.obtainedMarks} / ${q.totalMarks} Marks (${Math.round((q.obtainedMarks / q.totalMarks) * 100)}%)` 
                        : 'Evaluation Pending / Not graded yet'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded capitalize ${
                    q.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {q.status}
                  </span>
                </div>
              </>
            ) : (
              /* Tab 2: Subject & Faculty Info */
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                        {course?.code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">
                        {course?.name}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {course?.creditHours} Credit Hours
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Faculty Instructor</span>
                      <span className="font-medium text-slate-800">{course?.instructor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Classroom / Room</span>
                      <span className="font-medium text-slate-800">{course?.room}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Course Syllabus Outline
                  </div>
                  <p className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl text-slate-700 leading-relaxed text-xs">
                    {course?.syllabusSummary || 'Comprehensive curriculum aligned with higher education degree specifications.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pop-up Footer Action */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {/* Authorization-governed Edit Button: ADMIN can edit all, USER only own */}
              {(currentUser?.role === 'admin' || q.userId === currentUser?.userId) ? (
                <button
                  onClick={() => {
                    setEditingItem({ type: 'quiz', item: q });
                    handleClose();
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

              {/* Authorization-governed Delete Button: ADMIN can delete all, USER only own */}
              {(currentUser?.role === 'admin' || q.userId === currentUser?.userId) && (
                <button
                  onClick={() => {
                    const isAdmin = currentUser?.role === 'admin';
                    requestConfirmation({
                      title: isAdmin ? 'Admin Delete Quiz' : 'Delete Quiz',
                      message: isAdmin
                        ? `Administrative Authority: Are you sure you want to delete quiz "${q.title}"? It will be moved to the trash bin.`
                        : `Are you sure you want to delete your quiz "${q.title}"?`,
                      confirmText: 'Delete Quiz',
                      isAdminAction: isAdmin,
                      isDestructive: true,
                      onConfirm: async () => {
                        await deleteQuiz(q.id);
                        handleClose();
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
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
            >
              Close Pop-up
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     3. LECTURE POP-UP DETAILED TAB MODAL
     ------------------------------------------------------------- */
  if (selectedLectureDetail) {
    const l = selectedLectureDetail;
    const course = activeCourses.find(c => c.id === l.courseId);

    return (
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
          {/* Pop-up Header */}
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded">
                {course?.code || 'ACAD'}
              </span>
              <span className="font-semibold text-xs text-slate-800 truncate max-w-[260px] sm:max-w-xs">
                {course?.name || 'Academic Course'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleLecturePin(l.id)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  l.isPinned 
                    ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold' 
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                }`}
                title={l.isPinned ? "Unpin Lecture" : "Pin Lecture"}
              >
                <Pin className={`w-3.5 h-3.5 ${l.isPinned ? 'fill-amber-500' : ''}`} />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close Pop-up"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pop-up Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-slate-100 bg-white shrink-0">
            <button
              onClick={() => setActiveModalTab('details')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeModalTab === 'details'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lecture Details Tab</span>
            </button>
            <button
              onClick={() => setActiveModalTab('subject')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                activeModalTab === 'subject'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Subject & Faculty Info</span>
            </button>
          </div>

          {/* Pop-up Body: Scrollable */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
            {activeModalTab === 'details' ? (
              <>
                {/* 1. Lecture Number */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Lecture Number
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg">
                    <span className="font-mono text-xs font-bold text-emerald-900">
                      Lecture #{l.lectureNumber || 1}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700">
                      ({course?.code})
                    </span>
                  </div>
                </div>

                {/* 2. Lecture Title */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Lecture Title
                  </div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {l.title || l.topicsCovered}
                  </h2>
                </div>

                {/* 3. Lecture Date & Faculty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Lecture Date
                    </span>
                    <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {formatDate(l.date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Delivering Faculty
                    </span>
                    <span className="text-slate-800 font-semibold text-xs flex items-center gap-1.5 mt-1 font-sans">
                      <User className="w-4 h-4 text-slate-400" />
                      {l.instructor}
                    </span>
                  </div>
                </div>

                {/* 4. Complete Lecture Details/Content */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Complete Lecture Details/Content
                  </div>
                  <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal max-h-64 overflow-y-auto">
                    {l.conceptsSummary || 'No detailed lecture notes recorded.'}
                  </div>
                </div>

                {/* Homework / Action tasks */}
                {l.homeworkTasks && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                    <span className="font-bold block mb-1 text-[10px] uppercase">
                      Assigned Homework / Action Tasks
                    </span>
                    <span>{l.homeworkTasks}</span>
                  </div>
                )}

                {/* Slides URL */}
                {l.slidesUrl && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Presentation Slides & Materials
                    </div>
                    <a
                      href={l.slidesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-medium text-xs break-all p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg w-full"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>{l.slidesUrl}</span>
                    </a>
                  </div>
                )}
              </>
            ) : (
              /* Tab 2: Subject & Faculty Info */
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                        {course?.code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">
                        {course?.name}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {course?.creditHours} Credit Hours
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Faculty Instructor</span>
                      <span className="font-medium text-slate-800">{course?.instructor}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Classroom / Room</span>
                      <span className="font-medium text-slate-800">{course?.room}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Course Syllabus Outline
                  </div>
                  <p className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl text-slate-700 leading-relaxed text-xs">
                    {course?.syllabusSummary || 'Comprehensive curriculum aligned with higher education degree specifications.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pop-up Footer Action */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {/* Authorization-governed Edit Button: ADMIN can edit all, USER only own */}
              {(currentUser?.role === 'admin' || l.userId === currentUser?.userId) ? (
                <button
                  onClick={() => {
                    setEditingItem({ type: 'lecture', item: l });
                    handleClose();
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

              {/* Authorization-governed Delete Button: ADMIN can delete all, USER only own */}
              {(currentUser?.role === 'admin' || l.userId === currentUser?.userId) && (
                <button
                  onClick={() => {
                    const isAdmin = currentUser?.role === 'admin';
                    requestConfirmation({
                      title: isAdmin ? 'Admin Delete Lecture Note' : 'Delete Lecture Note',
                      message: isAdmin
                        ? `Administrative Authority: Are you sure you want to delete lecture note "${l.title || l.topicsCovered}"? It will be moved to the trash bin.`
                        : `Are you sure you want to delete your lecture note "${l.title || l.topicsCovered}"?`,
                      confirmText: 'Delete Lecture',
                      isAdminAction: isAdmin,
                      isDestructive: true,
                      onConfirm: async () => {
                        await deleteLecture(l.id);
                        handleClose();
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
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
            >
              Close Pop-up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
