import React from 'react';
import { 
  BookOpen, 
  CheckSquare, 
  FileText, 
  GraduationCap, 
  ArrowRight, 
  Sparkles,
  User,
  MapPin
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

export const DashboardView: React.FC = () => {
  const { 
    currentUser, 
    activeSemester, 
    activeCourses, 
    activeAssignments, 
    activeLectures, 
    activeQuizzes,
    openSubjectSection,
    setActiveView 
  } = useAcademic();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Academic Subjects Hub
            </h2>
            <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded font-semibold">
              {activeSemester?.name || 'Fall 2026'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome, <strong className="text-slate-800">{currentUser?.name}</strong>. Select any enrolled subject below to view its separated assignments, quizzes, and lecture notes.
          </p>
        </div>

        <button
          onClick={() => setActiveView('tutor')}
          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
          <span>Ask AI Academic Tutor</span>
        </button>
      </div>

      {/* Quick University Subject Buttons (Buttons, NOT tabs) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Enrolled Subjects (Click Subject Button):</span>
          </span>
          <span className="font-normal text-slate-400 font-mono text-[10px]">9 University Subjects</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {activeCourses.map(course => {
            const coursePending = activeAssignments.filter(a => a.courseId === course.id && a.status !== 'completed').length;
            return (
              <button
                key={course.id}
                onClick={() => openSubjectSection(course.id, 'assignments')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-600 hover:text-white border border-slate-200/80 hover:border-emerald-600 rounded-xl text-left transition-all group/btn cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs min-h-[64px]"
                title={`Open ${course.code} - ${course.name}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xs font-bold text-emerald-800 group-hover/btn:text-white transition-colors">
                    {course.code}
                  </span>
                  {coursePending > 0 && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded-full bg-amber-100 text-amber-800 group-hover/btn:bg-white/20 group-hover/btn:text-white font-bold">
                      {coursePending}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-slate-600 group-hover/btn:text-emerald-50 truncate w-full mt-1">
                  {course.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Page: ONLY SHOW THE SUBJECTS CARDS WITH DEDICATED SECTION BUTTONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeCourses.map(course => {
          const courseAssignments = activeAssignments.filter(a => a.courseId === course.id);
          const pendingAssignments = courseAssignments.filter(a => a.status !== 'completed');
          const courseLectures = activeLectures.filter(l => l.courseId === course.id);
          const courseQuizzes = activeQuizzes.filter(q => q.courseId === course.id);

          return (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-xs transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Subject Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {course.code}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {course.creditHours} Credit Hours
                  </span>
                </div>

                <h3 
                  onClick={() => openSubjectSection(course.id, 'assignments')}
                  className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 cursor-pointer transition-colors"
                >
                  {course.name}
                </h3>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-700">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{course.instructor}</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{course.room}</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                  {course.syllabusSummary}
                </p>
              </div>

              {/* Separated Subject Sections: Assignments, Quizzes, Lectures */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Subject Sections
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Assignments Section Button */}
                  <button
                    onClick={() => openSubjectSection(course.id, 'assignments')}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 rounded-lg text-left transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span className={`font-mono text-xs font-bold tabular-nums ${
                        pendingAssignments.length > 0 ? 'text-amber-600' : 'text-slate-700'
                      }`}>
                        {courseAssignments.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800">Assignments</span>
                  </button>

                  {/* Quizzes Section Button */}
                  <button
                    onClick={() => openSubjectSection(course.id, 'quizzes')}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 rounded-lg text-left transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-mono text-xs font-bold text-slate-700 tabular-nums">
                        {courseQuizzes.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800">Quizzes</span>
                  </button>

                  {/* Lectures Section Button */}
                  <button
                    onClick={() => openSubjectSection(course.id, 'lectures')}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 rounded-lg text-left transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-mono text-xs font-bold text-slate-700 tabular-nums">
                        {courseLectures.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800">Lectures</span>
                  </button>
                </div>

                {/* Open Full Hub Button */}
                <button
                  onClick={() => openSubjectSection(course.id, 'overview')}
                  className="w-full mt-2 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-emerald-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open {course.code} Hub</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
