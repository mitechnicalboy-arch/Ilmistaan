import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckSquare, 
  FileText, 
  GraduationCap, 
  Search,
  ExternalLink,
  Trash2,
  Archive
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { formatDate, getDeadlineUrgency } from '../../utils/dateUtils';

export const CoursesView: React.FC = () => {
  const { 
    activeCourses, 
    activeAssignments, 
    activeLectures, 
    activeQuizzes,
    navigateToCourse, 
    addCourse,
    deleteCourse,
    currentUser,
    requestConfirmation
  } = useAcademic();

  const [filterQuery, setFilterQuery] = useState('');
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [creditHours, setCreditHours] = useState(3);
  const [syllabusSummary, setSyllabusSummary] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const query = (filterQuery || '').toLowerCase();
  const filteredCourses = activeCourses.filter(c => 
    (c.name || '').toLowerCase().includes(query) ||
    (c.code || '').toLowerCase().includes(query) ||
    (c.instructor || '').toLowerCase().includes(query)
  );

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!courseName.trim() || !courseCode.trim()) {
      setErrorMsg('Course Name and Course Code are required.');
      return;
    }

    // Duplicate check
    const isDuplicate = activeCourses.some(c => c.code.toLowerCase() === courseCode.trim().toLowerCase());
    if (isDuplicate) {
      setErrorMsg(`A course with code "${courseCode.trim()}" already exists in this semester.`);
      return;
    }

    await addCourse({
      name: courseName.trim(),
      code: courseCode.trim().toUpperCase(),
      instructor: instructor.trim() || 'Course Faculty',
      room: room.trim() || 'TBD',
      creditHours: Number(creditHours) || 3,
      syllabusSummary: syllabusSummary.trim() || 'Course syllabus outline in progress.'
    });

    setCourseName('');
    setCourseCode('');
    setInstructor('');
    setRoom('');
    setCreditHours(3);
    setSyllabusSummary('');
    setIsAddCourseModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Subjects & Curriculum Directory
          </h2>
          <p className="text-xs text-slate-500">
            Fall 2026 Academic Term · {activeCourses.length} Registered Courses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter subjects..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>

          <button
            onClick={() => setIsAddCourseModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map(course => {
          const courseAssignments = activeAssignments.filter(a => a.courseId === course.id);
          const pendingAssignments = courseAssignments.filter(a => a.status !== 'completed');
          const completedAssignments = courseAssignments.filter(a => a.status === 'completed');
          const courseLectures = activeLectures.filter(l => l.courseId === course.id);
          const courseQuizzes = activeQuizzes.filter(q => q.courseId === course.id && q.status === 'upcoming');

          // Earliest upcoming deadline
          const sortedDeadlines = [...pendingAssignments]
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
          const earliestTask = sortedDeadlines[0];
          const deadlineInfo = earliestTask ? getDeadlineUrgency(earliestTask.deadline) : null;

          return (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-all p-5 shadow-2xs flex flex-col justify-between group"
            >
              <div>
                {/* Course Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                      {course.code}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {course.creditHours} Credit Hours
                    </span>
                  </div>
                  {(currentUser?.role === 'admin' || course.userId === currentUser?.userId) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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
                          }
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                      title={currentUser?.role === 'admin' ? "Admin Delete Subject" : "Move course to trash"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 
                  onClick={() => navigateToCourse(course.id)}
                  className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 cursor-pointer transition-colors"
                >
                  {course.name}
                </h3>

                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-slate-700">{course.instructor}</span>
                  <span aria-hidden="true">·</span>
                  <span>{course.room}</span>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {course.syllabusSummary}
                </p>
              </div>

              {/* Real-time Aggregated Metrics */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
                  <button
                    onClick={() => navigateToCourse(course.id, 'assignments')}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                  >
                    <div className="font-mono font-bold text-slate-800 tabular-nums">
                      {pendingAssignments.length}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Assignments</div>
                  </button>
                  <button
                    onClick={() => navigateToCourse(course.id, 'lectures')}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                  >
                    <div className="font-mono font-bold text-slate-800 tabular-nums">
                      {courseLectures.length}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Lectures</div>
                  </button>
                  <button
                    onClick={() => navigateToCourse(course.id, 'quizzes')}
                    className="p-2 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                  >
                    <div className="font-mono font-bold text-slate-800 tabular-nums">
                      {courseQuizzes.length}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">Quizzes</div>
                  </button>
                </div>

                {/* Earliest deadline indicator */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Next deadline:</span>
                  {deadlineInfo ? (
                    <span className={`font-mono tabular-nums font-semibold flex items-center gap-1 ${
                      deadlineInfo.urgency === 'overdue' ? 'text-rose-600' :
                      deadlineInfo.urgency === 'due_today' ? 'text-amber-600' :
                      'text-emerald-700'
                    }`}>
                      <Clock className="w-3 h-3 inline" />
                      {deadlineInfo.label}
                    </span>
                  ) : (
                    <span className="text-slate-400">No imminent task</span>
                  )}
                </div>

                <button
                  onClick={() => navigateToCourse(course.id)}
                  className="w-full mt-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Course Hub</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Course Modal */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Add Course to Active Term</h3>
            <p className="text-xs text-slate-500 mb-4">Register a new university syllabus course under Fall 2026.</p>

            {errorMsg && (
              <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Calculus"
                    value={courseName}
                    onChange={e => setCourseName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Course Code *</label>
                  <input
                    type="text"
                    placeholder="MATH-101"
                    value={courseCode}
                    onChange={e => setCourseCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Instructor / Professor</label>
                  <input
                    type="text"
                    placeholder="Dr. Tariq Mehmood"
                    value={instructor}
                    onChange={e => setInstructor(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lecture Hall / Room</label>
                  <input
                    type="text"
                    placeholder="Hall A-102"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Credit Hours</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={creditHours}
                  onChange={e => setCreditHours(parseInt(e.target.value) || 3)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Syllabus Overview</label>
                <textarea
                  rows={3}
                  placeholder="Outline key topics, course outcomes, or required textbooks..."
                  value={syllabusSummary}
                  onChange={e => setSyllabusSummary(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium shadow-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
