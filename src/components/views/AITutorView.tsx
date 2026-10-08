import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Bot, 
  User, 
  HelpCircle, 
  GraduationCap, 
  Compass, 
  Zap, 
  RotateCcw,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

type TutorPersona = 'advisor' | 'tutor' | 'exam' | 'quick';

export const AITutorView: React.FC = () => {
  const { 
    chatMessages, 
    addChatMessage, 
    clearChatHistory, 
    activeSemester, 
    activeCourses, 
    activeAssignments, 
    activeQuizzes,
    currentUser
  } = useAcademic();

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<TutorPersona>('tutor');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);

  // Pre-built prompt starters
  const promptStarters = [
    {
      label: 'Upcoming Deadlines Breakdown',
      text: 'Can you analyze my upcoming assignment deadlines for Fall 2026 and give me a realistic daily completion schedule?'
    },
    {
      label: 'Calculus Concept Derivation',
      text: 'Explain the Chain Rule and Implicit Differentiation in MATH-101 with a step-by-step example.'
    },
    {
      label: 'C Programming Pointer Drill',
      text: 'Give me 3 practice quiz questions on Pointer Arithmetic and Array Decay for CS-101 Programming Fundamentals.'
    },
    {
      label: 'Exam Revision Strategy',
      text: 'How should I structure my revision this week for my upcoming exams in Calculus and Programming?'
    }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isGenerating) return;

    const userMessageContent = text.trim();
    setInputPrompt('');

    // Save user message to persistent state / Firestore
    await addChatMessage({
      role: 'user',
      persona: selectedPersona,
      model: selectedModel,
      content: userMessageContent
    });

    setIsGenerating(true);

    // Prepare context payload
    const pendingTasks = activeAssignments.filter(a => a.status !== 'completed');
    const academicContext = {
      activeSemester: activeSemester?.name || 'Fall 2026',
      courses: activeCourses.map(c => ({ name: c.name, code: c.code, instructor: c.instructor })),
      pendingTasksCount: pendingTasks.length,
      upcomingQuizzes: activeQuizzes
        .filter(q => q.status === 'upcoming')
        .map(q => {
          const course = activeCourses.find(c => c.id === q.courseId);
          return {
            title: q.title,
            courseCode: course?.code || 'GEN',
            date: q.date,
            syllabusTopics: q.syllabusTopics
          };
        })
    };

    // Prepare history payload for server
    const currentHistory = [...chatMessages, { role: 'user' as const, content: userMessageContent }];
    const serverMessages = currentHistory.map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: serverMessages,
          persona: selectedPersona,
          model: selectedModel,
          academicContext
        })
      });

      const data = await response.json();
      const replyText = data.reply || 'I am ready to help you with your coursework. Please try asking again.';

      await addChatMessage({
        role: 'model',
        persona: selectedPersona,
        model: selectedModel,
        content: replyText
      });
    } catch (err: any) {
      console.error('Tutor request failed:', err);
      await addChatMessage({
        role: 'model',
        persona: selectedPersona,
        model: selectedModel,
        content: `Error connecting to AI Tutor: ${err?.message || 'Server unavailable.'}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-5xl mx-auto bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Tutor Header & Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Context-Aware Academic Tutor</span>
              <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                Fall 2026 Grounded
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Synchronized with your 9 active subjects and assignments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none text-slate-700"
            title="Integrated Gemini Model"
          >
            <option value="gemini-3.8-flash">gemini-3.8-flash (Standard)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Rapid)</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep Reasoning)</option>
          </select>

          {/* Clear History */}
          <button
            onClick={() => clearChatHistory()}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
            title="Clear conversation history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Persona Segmented Control */}
      <div className="px-4 py-2 bg-slate-50/40 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Persona:
        </span>
        <button
          onClick={() => setSelectedPersona('tutor')}
          className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            selectedPersona === 'tutor'
              ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Course Tutor</span>
        </button>
        <button
          onClick={() => setSelectedPersona('advisor')}
          className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            selectedPersona === 'advisor'
              ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Academic Advisor</span>
        </button>
        <button
          onClick={() => setSelectedPersona('exam')}
          className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            selectedPersona === 'exam'
              ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Exam Prep Specialist</span>
        </button>
        <button
          onClick={() => setSelectedPersona('quick')}
          className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            selectedPersona === 'quick'
              ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Fast Q&A</span>
        </button>
      </div>

      {/* Chat Stream Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {chatMessages.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Bot className="w-8 h-8 mx-auto text-emerald-600 mb-2 opacity-80" />
            <p className="font-semibold text-slate-700">How can I assist your Fall 2026 studies?</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Select a prompt below or ask any syllabus question.</p>
          </div>
        ) : (
          chatMessages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                  </div>
                )}

                <div className={`max-w-[82%] rounded-xl p-3.5 leading-relaxed space-y-1 ${
                  isUser 
                    ? 'bg-emerald-600 text-white shadow-2xs rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-line text-xs">
                    {msg.content}
                  </div>
                  <div className={`text-[10px] font-mono text-right mt-1 ${
                    isUser ? 'text-emerald-100' : 'text-slate-400'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            );
          })
        )}

        {isGenerating && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Consulting Fall 2026 syllabus & formulating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pre-built Prompt Starter Strip */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Starters:
        </span>
        {promptStarters.map((starter, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(starter.text)}
            className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            {starter.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask a question about Calculus, Programming, English, AICT, Islamiat, or Fahem-ul-Quran..."
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          disabled={isGenerating}
          className="flex-1 py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isGenerating}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
