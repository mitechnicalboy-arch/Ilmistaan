import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export interface AcademicContext {
  activeSemester: string;
  courses: Array<{ name: string; code: string; instructor?: string }>;
  pendingTasksCount: number;
  upcomingQuizzes: Array<{ title: string; courseCode: string; date: string; syllabusTopics?: string }>;
}

export interface TutorRequest {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  persona?: 'advisor' | 'tutor' | 'exam' | 'quick';
  model?: string;
  academicContext?: AcademicContext;
}

const PERSONA_INSTRUCTIONS: Record<string, string> = {
  advisor: `You are the University Academic Advisor. You specialize in semester management, balancing student study workloads, realistic study scheduling, preventing academic burnout, and prioritizing urgent deadlines. Be empathetic, practical, and structured.`,
  tutor: `You are the University Senior Course Tutor. You specialize in step-by-step conceptual explanations, deriving mathematical formulas, debugging code, breaking down syllabus concepts, and providing clear academic examples. Encourage deep understanding without just giving away answers.`,
  exam: `You are the University Exam Preparation Specialist. You specialize in active recall, creating quick self-quizzes, practice exam questions, mock tests on specific syllabus topics, and high-yield revision strategies. Quiz the student and give feedback.`,
  quick: `You are the Fast Academic Q&A Assistant. Deliver concise, rapid, bulleted clarifications, definitions, formula checks, and quick answers with zero unnecessary fluff.`
};

export async function handleTutorGeneration(body: TutorRequest): Promise<{ reply: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      reply: `Gemini API key is not configured in the environment. Please check the Secrets panel.`
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const persona = body.persona || 'tutor';
  const baseInstruction = PERSONA_INSTRUCTIONS[persona] || PERSONA_INSTRUCTIONS.tutor;
  
  // Grounding Context Injection
  let contextInstruction = `\n\n--- CURRENT STUDENT ACADEMIC REALITY CONTEXT ---`;
  if (body.academicContext) {
    const ctx = body.academicContext;
    contextInstruction += `\n- Active Semester: ${ctx.activeSemester || 'Fall 2026'}`;
    contextInstruction += `\n- Enrolled Courses (${ctx.courses.length}): ${ctx.courses.map(c => `${c.name} (${c.code})`).join(', ')}`;
    contextInstruction += `\n- Pending Assignments Count: ${ctx.pendingTasksCount}`;
    if (ctx.upcomingQuizzes && ctx.upcomingQuizzes.length > 0) {
      contextInstruction += `\n- Imminent Exams/Quizzes: ${ctx.upcomingQuizzes.map(q => `${q.title} [${q.courseCode}] on ${q.date}`).join('; ')}`;
    } else {
      contextInstruction += `\n- Imminent Exams/Quizzes: None currently scheduled in the next 7 days`;
    }
  }
  contextInstruction += `\n\nUse this real student academic context when advising, tailoring examples to their enrolled subjects (such as Calculus MATH-101, Functional English ENG-101, Programming Fundamentals CS-101, AICT CS-102, Pakistan Studies PST-101, Islamiat ISL-101, Fahem-ul-Quran FQ-102).`;

  // Model selection
  const validModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
  let chosenModel = body.model && validModels.includes(body.model) ? body.model : 'gemini-3.8-flash';

  const contents = body.messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: chosenModel,
      contents,
      config: {
        systemInstruction: `${baseInstruction}\n${contextInstruction}`,
        temperature: 0.7,
      }
    });

    const reply = response.text || 'I could not generate an answer at this time.';
    return { reply };
  } catch (error: any) {
    console.error('Error calling Gemini API on server:', error);
    return {
      reply: `Tutor error: ${error?.message || 'Unable to connect to Gemini academic engine.'}`
    };
  }
}
