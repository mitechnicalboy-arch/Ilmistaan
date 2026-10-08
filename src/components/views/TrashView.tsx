import React from 'react';
import { Trash2, RotateCcw, AlertTriangle, Lock } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

export const TrashView: React.FC = () => {
  const { 
    assignments, 
    lectures, 
    quizzes, 
    courses,
    restoreAssignment, 
    deleteAssignment,
    restoreLecture, 
    deleteLecture,
    restoreQuiz, 
    deleteQuiz,
    restoreCourse,
    deleteCourse,
    emptyTrash,
    currentUser,
    requestConfirmation
  } = useAcademic();

  const isAdmin = currentUser?.role === 'admin';

  const deletedAssignments = assignments.filter(a => a.isDeleted);
  const deletedLectures = lectures.filter(l => l.isDeleted);
  const deletedQuizzes = quizzes.filter(q => q.isDeleted);
  const deletedCourses = courses.filter(c => c.isDeleted);

  const totalTrash = deletedAssignments.length + deletedLectures.length + deletedQuizzes.length + deletedCourses.length;

  const handleEmptyAllTrash = () => {
    if (!isAdmin) return;
    requestConfirmation({
      title: 'Admin: Empty All Trash',
      message: `Administrator Authority: Permanently purge all ${totalTrash} soft-deleted records across courses, assignments, lectures, and quizzes? This operation cannot be undone.`,
      confirmText: `Empty All Trash (${totalTrash})`,
      isAdminAction: true,
      isDestructive: true,
      onConfirm: async () => {
        await emptyTrash();
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Trash Bin & Soft-Delete Recovery
          </h2>
          <p className="text-xs text-slate-500">
            Restore inadvertently deleted records or permanently wipe them from storage
          </p>
        </div>

        {isAdmin && totalTrash > 0 && (
          <button
            onClick={handleEmptyAllTrash}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
            title="Admin: Permanently wipe all items in the trash bin"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty All Trash ({totalTrash})</span>
          </button>
        )}
      </div>

      {totalTrash === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs shadow-2xs">
          <Trash2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">Trash bin is empty.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Deleted coursework deliverables will appear here for safe restoration.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Items in the trash can be restored back to your active semester or permanently destroyed.</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Deleted Courses */}
            {deletedCourses.map(c => {
              const canModify = isAdmin || c.userId === currentUser?.userId;
              return (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded mr-2">
                      Subject: {c.code}
                    </span>
                    <span className="font-semibold text-slate-900">{c.name}</span>
                  </div>
                  {canModify ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restoreCourse(c.id)}
                        className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => deleteCourse(c.id, true)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold cursor-pointer"
                      >
                        Wipe
                      </button>
                    </div>
                  ) : (
                    <span className="px-2 py-1 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Admin Only</span>
                    </span>
                  )}
                </div>
              );
            })}

            {/* Deleted Assignments */}
            {deletedAssignments.map(a => {
              const canModify = isAdmin || a.userId === currentUser?.userId;
              return (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-500 mr-2">[Assignment]</span>
                    <span className="font-semibold text-slate-900">{a.title}</span>
                  </div>
                  {canModify ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restoreAssignment(a.id)}
                        className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => deleteAssignment(a.id, true)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold cursor-pointer"
                      >
                        Wipe
                      </button>
                    </div>
                  ) : (
                    <span className="px-2 py-1 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded flex items-center gap-1" title="Created by another student">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Other Student's Item</span>
                    </span>
                  )}
                </div>
              );
            })}

            {/* Deleted Lectures */}
            {deletedLectures.map(l => {
              const canModify = isAdmin || l.userId === currentUser?.userId;
              return (
                <div key={l.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-500 mr-2">[Lecture]</span>
                    <span className="font-semibold text-slate-900">Lec #{l.lectureNumber}: {l.topicsCovered}</span>
                  </div>
                  {canModify ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restoreLecture(l.id)}
                        className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => deleteLecture(l.id, true)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold cursor-pointer"
                      >
                        Wipe
                      </button>
                    </div>
                  ) : (
                    <span className="px-2 py-1 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded flex items-center gap-1" title="Created by another student">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Other Student's Lecture</span>
                    </span>
                  )}
                </div>
              );
            })}

            {/* Deleted Quizzes */}
            {deletedQuizzes.map(q => {
              const canModify = isAdmin || q.userId === currentUser?.userId;
              return (
                <div key={q.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-slate-500 mr-2">[Quiz]</span>
                    <span className="font-semibold text-slate-900">{q.title}</span>
                  </div>
                  {canModify ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restoreQuiz(q.id)}
                        className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => deleteQuiz(q.id, true)}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-semibold cursor-pointer"
                      >
                        Wipe
                      </button>
                    </div>
                  ) : (
                    <span className="px-2 py-1 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded flex items-center gap-1" title="Created by another student">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Other Student's Quiz</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
