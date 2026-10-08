import React, { useEffect, useMemo } from 'react';
import { Search, X, BookOpen, CheckSquare, FileText, GraduationCap, ArrowRight } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate } from '../../utils/dateUtils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { 
    searchQuery, 
    setSearchQuery, 
    activeCourses, 
    activeAssignments, 
    activeLectures, 
    activeQuizzes,
    navigateToCourse,
    setActiveView 
  } = useAcademic();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setSearchQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, setSearchQuery]);

  const query = searchQuery.trim().toLowerCase();

  const matchingCourses = useMemo(() => {
    if (!query) return [];
    return activeCourses.filter(c => 
      c.name?.toLowerCase().includes(query) || 
      c.code?.toLowerCase().includes(query) ||
      c.instructor?.toLowerCase().includes(query) ||
      (c.syllabusSummary || '')?.toLowerCase().includes(query)
    );
  }, [activeCourses, query]);

  const matchingAssignments = useMemo(() => {
    if (!query) return [];
    return activeAssignments.filter(a => {
      const course = activeCourses.find(c => c.id === a.courseId);
      return a.title?.toLowerCase().includes(query) || 
        (a.description || '')?.toLowerCase().includes(query) ||
        (course && course.name?.toLowerCase().includes(query));
    });
  }, [activeAssignments, activeCourses, query]);

  const matchingLectures = useMemo(() => {
    if (!query) return [];
    return activeLectures.filter(l => 
      (l.title || '')?.toLowerCase().includes(query) ||
      (l.topicsCovered || '')?.toLowerCase().includes(query) ||
      (l.conceptsSummary || '')?.toLowerCase().includes(query) ||
      (l.instructor || '')?.toLowerCase().includes(query)
    );
  }, [activeLectures, query]);

  const matchingQuizzes = useMemo(() => {
    if (!query) return [];
    return activeQuizzes.filter(q => 
      q.title?.toLowerCase().includes(query) || 
      (q.syllabusTopics || '')?.toLowerCase().includes(query) ||
      (q.venue || '')?.toLowerCase().includes(query)
    );
  }, [activeQuizzes, query]);

  const totalResults = matchingCourses.length + matchingAssignments.length + matchingLectures.length + matchingQuizzes.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center p-4 pt-16 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-200 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search across all 9 subjects, deliverables, lecture topics, exams..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
            className="flex-1 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="font-mono text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded ml-1">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="max-h-[65vh] overflow-y-auto p-4 text-xs divide-y divide-slate-100">
          {!query ? (
            <div className="py-8 text-center text-slate-400">
              <p className="font-medium text-slate-600 mb-1">Global University Search</p>
              <p className="text-[11px]">Type to find course syllabus topics, homework assignments, formulas, or professors.</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="font-medium text-slate-600 mb-1">No matching records found</p>
              <p className="text-[11px]">Try searching by subject code (e.g. MATH-101, CS-101, FQ-102) or keywords like "pointer", "derivative", "constitution".</p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Courses */}
              {matchingCourses.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Subjects ({matchingCourses.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingCourses.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          navigateToCourse(c.id);
                          onClose();
                        }}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span>{c.name}</span>
                            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {c.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{c.syllabusSummary}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignments */}
              {matchingAssignments.length > 0 && (
                <div className="pt-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Assignments & Tasks ({matchingAssignments.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingAssignments.map(a => {
                      const course = activeCourses.find(c => c.id === a.courseId);
                      return (
                        <button
                          key={a.id}
                          onClick={() => {
                            setActiveView('assignments');
                            onClose();
                          }}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              <span>{a.title}</span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {course?.code} · Due {formatDate(a.deadline)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{a.description}</p>
                          </div>
                          <span className={`text-[10px] capitalize font-medium ${
                            a.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {a.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lectures */}
              {matchingLectures.length > 0 && (
                <div className="pt-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lecture Notes ({matchingLectures.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingLectures.map(l => {
                      const course = activeCourses.find(c => c.id === l.courseId);
                      return (
                        <button
                          key={l.id}
                          onClick={() => {
                            setActiveView('lectures');
                            onClose();
                          }}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                        >
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            <span>Lec {l.lectureNumber}: {l.topicsCovered}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {course?.code} · {formatDate(l.date)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{l.conceptsSummary}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quizzes */}
              {matchingQuizzes.length > 0 && (
                <div className="pt-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quizzes & Exams ({matchingQuizzes.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingQuizzes.map(q => {
                      const course = activeCourses.find(c => c.id === q.courseId);
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setActiveView('quizzes');
                            onClose();
                          }}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              <span>{q.title}</span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {course?.code} · {formatDate(q.date)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{q.syllabusTopics}</p>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {q.totalMarks} Marks
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
