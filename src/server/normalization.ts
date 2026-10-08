/**
 * Normalization utilities for cross-user duplicate prevention
 * Ensures titles with varied spacing, casing, unicode dashes, and punctuation
 * map to the same canonical identity.
 */

export function normalizeTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }

  return title
    // Decompose Unicode characters (e.g. accented characters, special ligatures)
    .normalize('NFKD')
    // Lowercase
    .toLowerCase()
    // Normalize Unicode dashes, em-dashes, en-dashes, minus signs to a hyphen
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    // Replace punctuation/symbols other than hyphens and alphanumeric characters with spaces
    .replace(/[^\p{L}\p{N}-]+/gu, ' ')
    // Normalize spaces around hyphens (e.g. " - " or "- " or " -" to " ")
    .replace(/\s*-\s*/g, ' ')
    // Normalize multiple consecutive hyphens or spaces
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    // Trim leading and trailing whitespace
    .trim();
}

/**
 * Extract integer sequence from academic titles (e.g. "Assignment 1", "Quiz 2", "Lab 03", "Problem Set 4")
 */
export function extractAcademicNumber(text: string): number | null {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/(?:assignment|assign|hw|problem\s*set|lecture|lec|quiz|lab|test|evaluation)\s*(?:#|no\.?|number)?\s*(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  const trailingNum = text.match(/\b(?:#|no\.?)\s*(\d+)\b/i);
  if (trailingNum && trailingNum[1]) {
    return parseInt(trailingNum[1], 10);
  }
  return null;
}

const STOP_WORDS = new Set(['and', 'or', 'the', 'in', 'of', 'for', 'on', 'at', 'to', 'a', 'an', 'is', 'with', 'by']);

/**
 * Tokenize a normalized title into significant words (min 2 chars, omitting stop words)
 */
export function tokenizeTitle(normalizedTitle: string): string[] {
  if (!normalizedTitle) return [];
  return normalizedTitle
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t));
}

/**
 * Jaccard token similarity coefficient between two sets of word tokens (0.0 to 1.0)
 */
export function calculateJaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionSize++;
    }
  }
  const unionSize = new Set([...tokensA, ...tokensB]).size;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

export interface AcademicRecordCheckPayload {
  type: 'assignment' | 'lecture' | 'quiz' | 'note';
  courseId: string;
  title: string;
  topicsCovered?: string;
  number?: number;
  date?: string;
  deadline?: string;
}

/**
 * Complete Cross-User Duplicate Prevention Algorithm:
 * Evaluates whether a new or updated record conflicts with an already-listed record in that course.
 */
export function areAcademicRecordsDuplicate(
  candidate: AcademicRecordCheckPayload,
  existing: AcademicRecordCheckPayload
): { isDuplicate: boolean; reason?: string } {
  // Course and type must match
  if (candidate.courseId !== existing.courseId) return { isDuplicate: false };
  if (candidate.type !== existing.type) return { isDuplicate: false };

  const candTitle = candidate.title || candidate.topicsCovered || '';
  const existTitle = existing.title || existing.topicsCovered || '';

  const candNorm = normalizeTitle(candTitle);
  const existNorm = normalizeTitle(existTitle);

  // Rule 1: Exact normalized title match
  if (candNorm && existNorm && candNorm === existNorm) {
    return {
      isDuplicate: true,
      reason: `An exact ${candidate.type} with title "${existing.title}" is already listed for this subject.`
    };
  }

  // Rule 2: Academic Number Collision (e.g. Assignment 1, Quiz 2, Lecture 1)
  const candNum = candidate.number !== undefined && candidate.number !== null ? candidate.number : extractAcademicNumber(candTitle);
  const existNum = existing.number !== undefined && existing.number !== null ? existing.number : extractAcademicNumber(existTitle);
  if (candNum !== null && existNum !== null && candNum === existNum) {
    return {
      isDuplicate: true,
      reason: `${candidate.type.charAt(0).toUpperCase() + candidate.type.slice(1)} #${candNum} ("${existing.title}") has already been listed for this subject. Duplicate coursework index is not allowed.`
    };
  }

  // Rule 3: High Semantic Token Similarity (>= 60% Jaccard match)
  const tokensCand = tokenizeTitle(candNorm);
  const tokensExist = tokenizeTitle(existNorm);
  if (tokensCand.length > 0 && tokensExist.length > 0) {
    const similarity = calculateJaccardSimilarity(tokensCand, tokensExist);
    if (similarity >= 0.60) {
      return {
        isDuplicate: true,
        reason: `A very similar ${candidate.type} ("${existing.title}") is already listed for this course (${Math.round(similarity * 100)}% keyword match).`
      };
    }
  }

  // Rule 4: Substantial Substring Containment (for titles >= 10 chars)
  if (
    candNorm.length >= 10 && 
    existNorm.length >= 10 && 
    (candNorm.includes(existNorm) || existNorm.includes(candNorm))
  ) {
    return {
      isDuplicate: true,
      reason: `This ${candidate.type} title overlaps with already listed coursework ("${existing.title}").`
    };
  }

  // Rule 5: Date and Index Collisions for Lectures and Quizzes
  if (candidate.type === 'lecture' && candidate.date && existing.date) {
    const candDateOnly = candidate.date.split('T')[0];
    const existDateOnly = existing.date.split('T')[0];
    if (candDateOnly === existDateOnly) {
      return {
        isDuplicate: true,
        reason: `A lecture for this subject is already listed on ${candDateOnly} ("${existing.title}"). Multiple lectures on the same date for the same subject are not permitted.`
      };
    }
  }

  if (candidate.type === 'quiz' && candidate.date && existing.date) {
    const candDateOnly = candidate.date.split('T')[0];
    const existDateOnly = existing.date.split('T')[0];
    if (candDateOnly === existDateOnly) {
      return {
        isDuplicate: true,
        reason: `A quiz for this subject is already scheduled on ${candDateOnly} ("${existing.title}"). Multiple evaluations on the same day for this subject are not permitted.`
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Generate a deterministic composite key for database-level unique locking.
 * E.g. "assignment:course_cs101_th:lab 03 loop construction"
 */
export function generateUniqueKey(type: string, courseId: string, normalizedTitle: string): string {
  const safeType = type.toLowerCase().trim();
  const safeCourseId = courseId.toLowerCase().trim();
  const safeTitle = normalizedTitle.toLowerCase().trim();
  return `${safeType}:${safeCourseId}:${safeTitle}`;
}

