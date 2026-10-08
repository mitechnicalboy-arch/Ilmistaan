import React, { useState } from 'react';
import { 
  CheckSquare, 
  Circle, 
  CheckCircle2, 
  Clock, 
  Pin, 
  Plus, 
  Calendar,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  ExternalLink,
  Edit3,
  Trash2,
  Lock
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate, getDeadlineUrgency } from '../../utils/dateUtils';
import { Assignment } from '../../types';

export const AssignmentsView: React.FC = () => {
  const { 
    activeAssignments, 
    activeCourses, 
    toggleAssignmentStatus,
    toggleAssignmentPin,
    setSelectedAssignmentDetail,
    setIsQuickAddOpen,
    setQuickAddType,
    currentUser,
    setEditingItem,
    deleteAssignment,
    requestConfirmation
  } = useAcademic();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeCourses[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);

  const selectedCourse = activeCourses.find(c => c.id === selectedSubjectId) || activeCourses[0];

  // Subject-wise assignments
  const subjectAssignments = activeAssignments
    .filter(a => a.courseId === selectedSubjectId)
    .filter(a => {
      if (statusFilter === 'pending') return a.status !== 'completed';
      if (statusFilter === 'completed') return a.status === 'completed';
      return true;
    })
    .sort((a, b) => (a.assignmentNumber || 0) - (b.assignmentNumber || 0));

  const activeAssignment = subjectAssignments.find(a => a.id === activeAssignmentId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Assignments by Subject
          </h2>
          <p className="text-xs text-slate-500">
            Select a subject to view its respective assignments, dates, and deadlines
          </p>
        </div>

        <button
          onClick={() => {
            setQuickAddType('assignment');
            setIsQuickAddOpen(true);
          }}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* 9 Subjects Buttons Grid (Buttons, NOT tabs) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select University Subject (Buttons):</span>
          </span>
          <span className="font-normal text-slate-400 font-mono text-[10px]">9 Courses Registered</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeCourses.map(course => {
            const isSelected = course.id === selectedSubjectId;
            const pendingCount = activeAssignments.filter(a => a.courseId === course.id && a.status !== 'completed').length;
            const totalCount = activeAssignments.filter(a => a.courseId === course.id).length;

            return (
              <button
                key={course.id}
                onClick={() => {
                  setSelectedSubjectId(course.id);
                  setActiveAssignmentId(null);
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
                    isSelected ? 'text-white' : pendingCount > 0 ? 'text-amber-600' : 'text-slate-700'
                  }`}>
                    {totalCount} Total
                  </span>
                  <span className={`text-[10px] font-mono block ${
                    isSelected ? 'text-emerald-100' : 'text-slate-400'
                  }`}>
                    {pendingCount} Pending
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Assignments Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        {/* If an assignment is clicked, open the detailed view */}
        {activeAssignment ? (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setActiveAssignmentId(null)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {selectedCourse?.name} Assignments</span>
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

            {/* Assignment Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded">
                  Assignment #{activeAssignment.assignmentNumber || 1}
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {selectedCourse?.code} · {selectedCourse?.name}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {activeAssignment.title}
              </h3>
            </div>

            {/* Date Grid: Assignment Date & Deadline Date */}
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

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Detailed Assignment Description & Requirements
              </div>
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl text-slate-800 leading-relaxed whitespace-pre-line text-xs">
                {activeAssignment.description || 'No detailed instructions recorded for this assignment.'}
              </div>
            </div>

            {/* Cloud Resource Link */}
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

            {/* Action Buttons */}
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
          /* Assignment List for Selected Subject */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {selectedCourse?.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedCourse?.name} — All Assignments
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Showing assignments organized for {selectedCourse?.name}. Click any row to open the detailed view.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  All ({activeAssignments.filter(a => a.courseId === selectedSubjectId).length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {subjectAssignments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No assignments found for {selectedCourse?.name}.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Use "New Assignment" button to log problem sets for this subject.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subjectAssignments.map((assign, idx) => {
                  const { urgency, label } = getDeadlineUrgency(assign.deadline);
                  const isCompleted = assign.status === 'completed';
                  const assignNum = assign.assignmentNumber || (idx + 1);

                  return (
                    <div
                      key={assign.id}
                      onClick={() => {
                        setActiveAssignmentId(assign.id);
                      }}
                      className="py-3.5 px-3 hover:bg-emerald-50/40 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
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

                      {/* Assignment Date & Deadline Date */}
                      <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                        <div className="text-right hidden sm:block">
                          <span className="text-slate-400 block text-[10px]">Assignment Date</span>
                          <span className="text-slate-700">{formatDate(assign.dateAssigned)}</span>
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

                        {(currentUser?.role === 'admin' || assign.userId === currentUser?.userId) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isAdmin = currentUser?.role === 'admin';
                              requestConfirmation({
                                title: isAdmin ? 'Admin Delete Assignment' : 'Delete Assignment',
                                message: isAdmin
                                  ? `Administrative Authority: Are you sure you want to delete assignment "${assign.title}"? It will be moved to the trash bin.`
                                  : `Are you sure you want to delete your assignment "${assign.title}"?`,
                                confirmText: 'Delete Assignment',
                                isAdminAction: isAdmin,
                                isDestructive: true,
                                onConfirm: async () => {
                                  await deleteAssignment(assign.id);
                                }
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                            title={currentUser?.role === 'admin' ? "Admin Delete Assignment" : "Delete My Assignment"}
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
