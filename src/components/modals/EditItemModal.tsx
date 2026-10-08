import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { Assignment, Lecture, Quiz } from '../../types';

export const EditItemModal: React.FC = () => {
  const { 
    editingItem, 
    setEditingItem, 
    activeCourses, 
    updateAssignment, 
    updateLecture, 
    updateQuiz,
    currentUser
  } = useAcademic();

  const [courseId, setCourseId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assignment fields
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDateAssigned, setAssignDateAssigned] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [assignPriority, setAssignPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [assignResource, setAssignResource] = useState('');

  // Lecture fields
  const [lecNumber, setLecNumber] = useState<number>(1);
  const [lecDate, setLecDate] = useState('');
  const [lecInstructor, setLecInstructor] = useState('');
  const [lecTopics, setLecTopics] = useState('');
  const [lecConcepts, setLecConcepts] = useState('');
  const [lecHomework, setLecHomework] = useState('');
  const [lecSlides, setLecSlides] = useState('');

  // Quiz fields
  const [quizNumber, setQuizNumber] = useState<number>(1);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizAssignedDate, setQuizAssignedDate] = useState('');
  const [quizDate, setQuizDate] = useState('');
  const [quizVenue, setQuizVenue] = useState('');
  const [quizTopics, setQuizTopics] = useState('');
  const [quizTotalMarks, setQuizTotalMarks] = useState<number>(20);

  useEffect(() => {
    setErrorMsg(null);
    if (!editingItem) return;

    if (editingItem.type === 'assignment') {
      const a = editingItem.item as Assignment;
      setCourseId(a.courseId);
      setAssignTitle(a.title);
      setAssignDesc(a.description || '');
      setAssignDateAssigned(a.dateAssigned ? a.dateAssigned.split('T')[0] : '');
      setAssignDeadline(a.deadline ? a.deadline.split('T')[0] : '');
      setAssignPriority(a.priority || 'medium');
      setAssignResource(a.resourceLink || '');
    } else if (editingItem.type === 'lecture') {
      const l = editingItem.item as Lecture;
      setCourseId(l.courseId);
      setLecNumber(l.lectureNumber || 1);
      setLecDate(l.date ? l.date.split('T')[0] : '');
      setLecInstructor(l.instructor || '');
      setLecTopics(l.topicsCovered || l.title || '');
      setLecConcepts(l.conceptsSummary || '');
      setLecHomework(l.homeworkTasks || '');
      setLecSlides(l.slidesUrl || '');
    } else if (editingItem.type === 'quiz') {
      const q = editingItem.item as Quiz;
      setCourseId(q.courseId);
      setQuizNumber(q.quizNumber || 1);
      setQuizTitle(q.title);
      setQuizAssignedDate(q.assignedDate ? q.assignedDate.split('T')[0] : '');
      setQuizDate(q.date || '');
      setQuizVenue(q.venue || '');
      setQuizTopics(q.syllabusTopics || '');
      setQuizTotalMarks(q.totalMarks || 20);
    }
  }, [editingItem]);

  if (!editingItem) return null;

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = editingItem.item.userId === currentUser?.userId;

  // Strict UI Gate: If regular user tries to edit someone else's record, show denied dialog
  if (!isAdmin && !isOwner) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Permission Denied</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sirf Admin sab edit kar sakta hai. Aap sirf apni ID se add kia huwa coursework hi edit kar sakte hain. Dusre student ka {editingItem.type} edit karne ki permission nahi hai.
          </p>
          <button
            type="button"
            onClick={() => setEditingItem(null)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    if (!isAdmin && !isOwner) {
      setErrorMsg('Access denied: Only Admin or the creator student can edit this item.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingItem.type === 'assignment') {
        if (!assignTitle.trim()) {
          setErrorMsg('Assignment title is required');
          setIsSubmitting(false);
          return;
        }

        const res = await updateAssignment(editingItem.item.id, {
          courseId,
          title: assignTitle.trim(),
          description: assignDesc.trim(),
          dateAssigned: assignDateAssigned,
          deadline: assignDeadline,
          priority: assignPriority,
          resourceLink: assignResource.trim() || undefined
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to update assignment.');
          setIsSubmitting(false);
          return;
        }
      } else if (editingItem.type === 'lecture') {
        if (!lecTopics.trim()) {
          setErrorMsg('Lecture topic is required');
          setIsSubmitting(false);
          return;
        }

        const res = await updateLecture(editingItem.item.id, {
          courseId,
          lectureNumber: Number(lecNumber) || 1,
          title: lecTopics.trim(),
          topicsCovered: lecTopics.trim(),
          date: lecDate,
          instructor: lecInstructor.trim(),
          conceptsSummary: lecConcepts.trim(),
          homeworkTasks: lecHomework.trim() || undefined,
          slidesUrl: lecSlides.trim() || undefined
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to update lecture.');
          setIsSubmitting(false);
          return;
        }
      } else if (editingItem.type === 'quiz') {
        if (!quizTitle.trim()) {
          setErrorMsg('Quiz title is required');
          setIsSubmitting(false);
          return;
        }

        const res = await updateQuiz(editingItem.item.id, {
          courseId,
          quizNumber: Number(quizNumber) || 1,
          title: quizTitle.trim(),
          assignedDate: quizAssignedDate,
          date: quizDate,
          venue: quizVenue.trim(),
          syllabusTopics: quizTopics.trim(),
          totalMarks: Number(quizTotalMarks) || 20
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to update quiz.');
          setIsSubmitting(false);
          return;
        }
      }

      setEditingItem(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                Edit {editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)}
              </span>
              {isAdmin ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Admin Edit (Full Rights)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Owner Edit (Your Record)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Subject academic identity and normalized duplicate protections apply.
            </p>
          </div>
          <button
            onClick={() => setEditingItem(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="text-xs">
                <span className="font-bold block">Update Conflict:</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Subject Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Subject</label>
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-xs"
              required
            >
              {activeCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name} ({c.instructor})
                </option>
              ))}
            </select>
          </div>

          {/* 1. Assignment Edit Fields */}
          {editingItem.type === 'assignment' && (
            <>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={assignTitle}
                  onChange={e => setAssignTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={assignDesc}
                  onChange={e => setAssignDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 font-sans">Date Assigned</label>
                  <input
                    type="date"
                    value={assignDateAssigned}
                    onChange={e => setAssignDateAssigned(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 font-sans">Deadline Date</label>
                  <input
                    type="date"
                    value={assignDeadline}
                    onChange={e => setAssignDeadline(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={assignPriority}
                    onChange={e => setAssignPriority(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resource / Drive Link</label>
                  <input
                    type="url"
                    value={assignResource}
                    onChange={e => setAssignResource(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {/* 2. Lecture Edit Fields */}
          {editingItem.type === 'lecture' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lecture #</label>
                  <input
                    type="number"
                    min="1"
                    value={lecNumber}
                    onChange={e => setLecNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Lecture Date</label>
                  <input
                    type="date"
                    value={lecDate}
                    onChange={e => setLecDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivering Faculty Instructor</label>
                <input
                  type="text"
                  value={lecInstructor}
                  onChange={e => setLecInstructor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lecture Topic / Title</label>
                <input
                  type="text"
                  value={lecTopics}
                  onChange={e => setLecTopics(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Core Concepts & Detailed Notes</label>
                <textarea
                  rows={3}
                  value={lecConcepts}
                  onChange={e => setLecConcepts(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Homework / Tasks</label>
                <input
                  type="text"
                  value={lecHomework}
                  onChange={e => setLecHomework(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Presentation Slides URL</label>
                <input
                  type="url"
                  value={lecSlides}
                  onChange={e => setLecSlides(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>
            </>
          )}

          {/* 3. Quiz Edit Fields */}
          {editingItem.type === 'quiz' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quiz #</label>
                  <input
                    type="number"
                    min="1"
                    value={quizNumber}
                    onChange={e => setQuizNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={e => setQuizTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 font-sans">Date Assigned</label>
                  <input
                    type="date"
                    value={quizAssignedDate}
                    onChange={e => setQuizAssignedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 font-sans">Deadline / Quiz Date</label>
                  <input
                    type="datetime-local"
                    value={quizDate}
                    onChange={e => setQuizDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Classroom / Venue</label>
                  <input
                    type="text"
                    value={quizVenue}
                    onChange={e => setQuizVenue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={quizTotalMarks}
                    onChange={e => setQuizTotalMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Syllabus Topics Covered</label>
                <textarea
                  rows={3}
                  value={quizTopics}
                  onChange={e => setQuizTopics(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
