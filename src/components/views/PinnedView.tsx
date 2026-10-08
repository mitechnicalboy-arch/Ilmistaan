import React from 'react';
import { Pin, CheckSquare, FileText, GraduationCap, Circle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate } from '../../utils/dateUtils';

export const PinnedView: React.FC = () => {
  const { 
    activeAssignments, 
    activeLectures, 
    activeQuizzes, 
    activeCourses,
    toggleAssignmentStatus,
    toggleAssignmentPin,
    toggleLecturePin,
    toggleQuizPin,
    setSelectedAssignmentDetail,
    setSelectedQuizDetail,
    setSelectedLectureDetail
  } = useAcademic();

  const pinnedAssignments = activeAssignments.filter(a => a.isPinned);
  const pinnedLectures = activeLectures.filter(l => l.isPinned);
  const pinnedQuizzes = activeQuizzes.filter(q => q.isPinned);

  const totalPinned = pinnedAssignments.length + pinnedLectures.length + pinnedQuizzes.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Pinned Workspace & Critical References
        </h2>
        <p className="text-xs text-slate-500">
          Flagged homework deliverables, high-yield lecture notes, and upcoming examinations
        </p>
      </div>

      {totalPinned === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs shadow-2xs">
          <Pin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No pinned items in your workspace.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Click the pin icon on any assignment, lecture note, or quiz to highlight it here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Assignments */}
          {pinnedAssignments.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Flagged Assignments ({pinnedAssignments.length})</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {pinnedAssignments.map(a => {
                  const course = activeCourses.find(c => c.id === a.courseId);
                  return (
                    <div key={a.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleAssignmentStatus(a.id)}
                          className="text-slate-400 hover:text-emerald-600"
                        >
                          {a.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4" />}
                        </button>
                        <div>
                          <span 
                            onClick={() => setSelectedAssignmentDetail(a)}
                            className={`font-semibold cursor-pointer hover:text-emerald-800 transition-colors ${
                              a.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {a.title}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px] ml-2">
                            {course?.code} · Due {formatDate(a.deadline)}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => toggleAssignmentPin(a.id)} className="p-1 text-amber-500 hover:text-slate-400">
                        <Pin className="w-3.5 h-3.5 fill-amber-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pinned Lectures */}
          {pinnedLectures.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Critical Lecture Reference Notes ({pinnedLectures.length})</span>
              </div>
              <div className="space-y-2 text-xs">
                {pinnedLectures.map(l => {
                  const course = activeCourses.find(c => c.id === l.courseId);
                  return (
                    <div 
                      key={l.id} 
                      onClick={() => setSelectedLectureDetail(l)}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-300 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-slate-900">
                          {course?.code} · Lec #{l.lectureNumber}: {l.topicsCovered}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLecturePin(l.id);
                          }}
                        >
                          <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600">{l.conceptsSummary}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pinned Quizzes */}
          {pinnedQuizzes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>High-Priority Examination Cards ({pinnedQuizzes.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {pinnedQuizzes.map(q => {
                  const course = activeCourses.find(c => c.id === q.courseId);
                  return (
                    <div 
                      key={q.id} 
                      onClick={() => setSelectedQuizDetail(q)}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-300 rounded-lg flex flex-col justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                            {course?.code}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleQuizPin(q.id);
                            }}
                          >
                            <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          </button>
                        </div>
                        <h4 className="font-semibold text-slate-900">{q.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1">Date: {formatDate(q.date)} · Venue: {q.venue}</p>
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
  );
};
