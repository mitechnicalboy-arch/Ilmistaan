import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar, 
  ChevronRight,
  User,
  ArrowLeft,
  Pin,
  ExternalLink,
  Edit3,
  Trash2,
  Lock
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate } from '../../utils/dateUtils';
import { Lecture } from '../../types';

export const LecturesView: React.FC = () => {
  const { 
    activeLectures, 
    activeCourses, 
    toggleLecturePin,
    setSelectedLectureDetail,
    setIsQuickAddOpen,
    setQuickAddType,
    currentUser,
    setEditingItem,
    deleteLecture,
    requestConfirmation
  } = useAcademic();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(activeCourses[0]?.id || '');
  const [activeLectureId, setActiveLectureId] = useState<string | null>(null);

  const selectedCourse = activeCourses.find(c => c.id === selectedSubjectId) || activeCourses[0];

  const subjectLectures = activeLectures
    .filter(l => l.courseId === selectedSubjectId)
    .sort((a, b) => (a.lectureNumber || 0) - (b.lectureNumber || 0));

  const activeLecture = subjectLectures.find(l => l.id === activeLectureId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Curriculum Lectures by Subject
          </h2>
          <p className="text-xs text-slate-500">
            Select a subject to view its delivered lectures, notes, and study materials
          </p>
        </div>

        <button
          onClick={() => {
            setQuickAddType('lecture');
            setIsQuickAddOpen(true);
          }}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Lecture Note</span>
        </button>
      </div>

      {/* 9 Subjects Buttons Grid (Buttons, NOT tabs) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-700">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select University Subject (Buttons):</span>
          </span>
          <span className="font-normal text-slate-400 font-mono text-[10px]">9 Courses Registered</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeCourses.map(course => {
            const isSelected = course.id === selectedSubjectId;
            const count = activeLectures.filter(l => l.courseId === course.id).length;

            return (
              <button
                key={course.id}
                onClick={() => {
                  setSelectedSubjectId(course.id);
                  setActiveLectureId(null);
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
                    {count} Delivered
                  </span>
                  <span className={`text-[10px] font-mono block ${
                    isSelected ? 'text-emerald-100' : 'text-slate-400'
                  }`}>
                    Notes Saved
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Lectures Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        {/* If a lecture is clicked, open the detailed view */}
        {activeLecture ? (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setActiveLectureId(null)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {selectedCourse?.name} Lectures</span>
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

            {/* Lecture Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded">
                  Lecture #{activeLecture.lectureNumber || 1}
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {selectedCourse?.code} · {selectedCourse?.name}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {activeLecture.title || activeLecture.topicsCovered}
              </h3>
            </div>

            {/* Date Grid: Lecture Date & Delivering Faculty */}
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

            {/* Assigned Classroom Tasks */}
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

            {/* Actions Footer */}
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
                          ? `Administrative Authority: Are you sure you want to delete lecture note "${activeLecture.title || activeLecture.topicsCovered}"? It will be moved to the trash bin.`
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
          /* Lecture List for Selected Subject */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {selectedCourse?.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedCourse?.name} — Delivered Lectures
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Showing lectures organized for {selectedCourse?.name}. Click any row to open the complete lecture content.
                </p>
              </div>

              <span className="font-mono text-xs text-slate-400">
                Total {subjectLectures.length} Lectures
              </span>
            </div>

            {subjectLectures.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No lecture notes catalogued for {selectedCourse?.name}.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Log Lecture Note" to record today's classroom topics.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subjectLectures.map((lec, idx) => {
                  const lecNum = lec.lectureNumber || (idx + 1);

                  return (
                    <div
                      key={lec.id}
                      onClick={() => {
                        setActiveLectureId(lec.id);
                      }}
                      className="py-3.5 px-3 hover:bg-emerald-50/40 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs group cursor-pointer"
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

                        {(currentUser?.role === 'admin' || lec.userId === currentUser?.userId) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const isAdmin = currentUser?.role === 'admin';
                              requestConfirmation({
                                title: isAdmin ? 'Admin Delete Lecture Note' : 'Delete Lecture Note',
                                message: isAdmin
                                  ? `Administrative Authority: Are you sure you want to delete lecture "${lec.title || lec.topicsCovered}"? It will be moved to the trash bin.`
                                  : `Are you sure you want to delete your lecture "${lec.title || lec.topicsCovered}"?`,
                                confirmText: 'Delete Lecture',
                                isAdminAction: isAdmin,
                                isDestructive: true,
                                onConfirm: async () => {
                                  await deleteLecture(lec.id);
                                }
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                            title={currentUser?.role === 'admin' ? "Admin Delete Lecture" : "Delete My Lecture"}
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
