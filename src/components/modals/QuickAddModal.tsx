import React, { useState } from 'react';
import { X, CheckSquare, FileText, GraduationCap, AlertCircle } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { PriorityLevel } from '../../types';

export const QuickAddModal: React.FC = () => {
  const { 
    isQuickAddOpen, 
    setIsQuickAddOpen, 
    quickAddType, 
    setQuickAddType,
    activeCourses,
    selectedCourseId,
    addAssignment,
    addLecture,
    addQuiz
  } = useAcademic();

  const [courseId, setCourseId] = useState<string>(() => {
    return selectedCourseId || (activeCourses[0]?.id || '');
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assignment fields
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDateAssigned, setAssignDateAssigned] = useState('2026-10-04');
  const [assignDeadline, setAssignDeadline] = useState('2026-10-10');
  const [assignPriority, setAssignPriority] = useState<PriorityLevel>('medium');
  const [assignResource, setAssignResource] = useState('');

  // Lecture fields
  const [lecNumber, setLecNumber] = useState<number>(1);
  const [lecDate, setLecDate] = useState('2026-10-04');
  const [lecInstructor, setLecInstructor] = useState('');
  const [lecTopics, setLecTopics] = useState('');
  const [lecConcepts, setLecConcepts] = useState('');
  const [lecHomework, setLecHomework] = useState('');
  const [lecSlides, setLecSlides] = useState('');

  // Quiz fields
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDate, setQuizDate] = useState('2026-10-12T10:00');
  const [quizVenue, setQuizVenue] = useState('');
  const [quizTopics, setQuizTopics] = useState('');
  const [quizTotalMarks, setQuizTotalMarks] = useState<number>(20);

  if (!isQuickAddOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (quickAddType === 'assignment') {
        if (!assignTitle.trim()) {
          setErrorMsg('Assignment title is required');
          setIsSubmitting(false);
          return;
        }
        const res = await addAssignment({
          courseId,
          title: assignTitle.trim(),
          description: assignDesc.trim(),
          dateAssigned: assignDateAssigned,
          deadline: assignDeadline,
          priority: assignPriority,
          status: 'pending',
          resourceLink: assignResource.trim() || undefined
        });

        if (!res.success) {
          setErrorMsg(res.error || 'This assignment already exists for this subject.');
          setIsSubmitting(false);
          return;
        }
      } else if (quickAddType === 'lecture') {
        if (!lecTopics.trim()) {
          setErrorMsg('Lecture topic is required');
          setIsSubmitting(false);
          return;
        }
        const selectedCourse = activeCourses.find(c => c.id === courseId);
        const res = await addLecture({
          courseId,
          lectureNumber: Number(lecNumber) || 1,
          title: lecTopics.trim(),
          date: lecDate,
          instructor: lecInstructor.trim() || selectedCourse?.instructor || 'Course Professor',
          topicsCovered: lecTopics.trim(),
          conceptsSummary: lecConcepts.trim(),
          homeworkTasks: lecHomework.trim() || undefined,
          slidesUrl: lecSlides.trim() || undefined
        });

        if (!res.success) {
          setErrorMsg(res.error || 'This lecture already exists for this subject.');
          setIsSubmitting(false);
          return;
        }
      } else if (quickAddType === 'quiz') {
        if (!quizTitle.trim()) {
          setErrorMsg('Quiz title is required');
          setIsSubmitting(false);
          return;
        }
        const selectedCourse = activeCourses.find(c => c.id === courseId);
        const res = await addQuiz({
          courseId,
          quizNumber: 1,
          title: quizTitle.trim(),
          assignedDate: new Date().toISOString().split('T')[0],
          date: quizDate,
          venue: quizVenue.trim() || selectedCourse?.room || 'Main Examination Hall',
          syllabusTopics: quizTopics.trim(),
          totalMarks: Number(quizTotalMarks) || 20,
          obtainedMarks: null,
          status: 'upcoming'
        });

        if (!res.success) {
          setErrorMsg(res.error || 'This quiz already exists for this subject.');
          setIsSubmitting(false);
          return;
        }
      }

      setIsQuickAddOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900">Universal Academic Entry</span>
            <span className="text-[11px] text-slate-400 font-mono">· Fall 2026</span>
          </div>
          <button
            onClick={() => setIsQuickAddOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setQuickAddType('assignment')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                quickAddType === 'assignment'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Assignment</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickAddType('lecture')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                quickAddType === 'lecture'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lecture Note</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickAddType('quiz')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                quickAddType === 'quiz'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Quiz / Exam</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="text-xs">
                <span className="font-bold block">Duplicate Detected:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Course Selection */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Select Enrolled Subject <span className="text-rose-500">*</span>
            </label>
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-medium text-slate-800"
              required
            >
              {activeCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) — {c.creditHours} Cr
                </option>
              ))}
            </select>
          </div>

          {/* Conditional inputs per type */}
          {quickAddType === 'assignment' && (
            <>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Assignment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Problem Set 5: Integration by Parts"
                  value={assignTitle}
                  onChange={e => setAssignTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date Assigned</label>
                  <input
                    type="date"
                    value={assignDateAssigned}
                    onChange={e => setAssignDateAssigned(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Deadline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={assignDeadline}
                    onChange={e => setAssignDeadline(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={assignPriority}
                    onChange={e => setAssignPriority(e.target.value as PriorityLevel)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cloud Resource URL</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={assignResource}
                    onChange={e => setAssignResource(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Instructions & Description</label>
                <textarea
                  rows={3}
                  placeholder="Specific problem questions, submission format, or instructions..."
                  value={assignDesc}
                  onChange={e => setAssignDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {quickAddType === 'lecture' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Lecture #</label>
                  <input
                    type="number"
                    min={1}
                    value={lecNumber}
                    onChange={e => setLecNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Date Delivered</label>
                  <input
                    type="date"
                    value={lecDate}
                    onChange={e => setLecDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Topics Covered <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dynamic Memory Allocation: malloc vs calloc"
                  value={lecTopics}
                  onChange={e => setLecTopics(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Key Concepts & Formulas</label>
                <textarea
                  rows={3}
                  placeholder="Detailed notes, equations, proofs, or key definitions..."
                  value={lecConcepts}
                  onChange={e => setLecConcepts(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Homework / Tasks</label>
                  <input
                    type="text"
                    placeholder="Chapter 4 exercises..."
                    value={lecHomework}
                    onChange={e => setLecHomework(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Slide / Handout URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={lecSlides}
                    onChange={e => setLecSlides(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                  />
                </div>
              </div>
            </>
          )}

          {quickAddType === 'quiz' && (
            <>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Quiz / Exam Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Examination 1"
                  value={quizTitle}
                  onChange={e => setQuizTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={quizDate}
                    onChange={e => setQuizDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={quizTotalMarks}
                    onChange={e => setQuizTotalMarks(parseInt(e.target.value) || 20)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Classroom / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Hall A-102"
                  value={quizVenue}
                  onChange={e => setQuizVenue(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Syllabus Topics Covered</label>
                <textarea
                  rows={3}
                  placeholder="Chapters, topics, and specific scope for revision..."
                  value={quizTopics}
                  onChange={e => setQuizTopics(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(false)}
              className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800 rounded-md font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium shadow-xs"
            >
              Save to Diary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
