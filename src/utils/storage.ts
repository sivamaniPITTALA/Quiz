import { Quiz, GradeReportEntry } from '../types';
import { INITIAL_QUIZZES } from '../data/sampleQuizzes';

const QUIZZES_STORAGE_KEY = 'live_quiz_faculty_quizzes';
const OFFLINE_ATTEMPTS_KEY = 'live_quiz_offline_attempts';
const THEME_KEY = 'live_quiz_theme';
const GRADEBOOK_KEY = 'live_quiz_saved_gradebooks';

export function getStoredQuizzes(): Quiz[] {
  if (typeof window === 'undefined') return INITIAL_QUIZZES;
  try {
    const data = localStorage.getItem(QUIZZES_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(INITIAL_QUIZZES));
      return INITIAL_QUIZZES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_QUIZZES;
  }
}

export function saveQuizToStorage(quiz: Quiz): Quiz[] {
  const quizzes = getStoredQuizzes();
  const index = quizzes.findIndex((q) => q.id === quiz.id);
  let updated: Quiz[];
  if (index >= 0) {
    updated = [...quizzes];
    updated[index] = { ...quiz, updatedAt: new Date().toISOString() };
  } else {
    updated = [quiz, ...quizzes];
  }
  try {
    localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save quiz to localStorage', e);
  }
  return updated;
}

export function deleteQuizFromStorage(id: string): Quiz[] {
  const quizzes = getStoredQuizzes();
  const updated = quizzes.filter((q) => q.id !== id);
  try {
    localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete quiz', e);
  }
  return updated;
}

export function exportQuizAsJsonFile(quiz: Quiz) {
  const blob = new Blob([JSON.stringify(quiz, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${quiz.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-quiz-offline.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportGradebookCsv(
  assignmentTitle: string,
  grades: GradeReportEntry[]
) {
  const headers = [
    'Student Name',
    'Student ID',
    'Email',
    'Score',
    'Total Possible',
    'Percentage (%)',
    'Letter Grade',
    'Correct Answers',
    'Total Questions',
    'Avg Time (s)',
    'Status',
  ];

  const rows = grades.map((g) => [
    `"${g.studentName.replace(/"/g, '""')}"`,
    `"${g.studentId}"`,
    `"${g.email || ''}"`,
    g.score,
    g.totalPossible,
    g.percentage.toFixed(1),
    g.letterGrade,
    g.correctCount,
    g.totalQuestions,
    g.averageResponseTimeSeconds.toFixed(1),
    g.status,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join(
    '\n'
  );
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${assignmentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-gradebook.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface OfflineAttemptRecord {
  quizId: string;
  quizTitle: string;
  studentName: string;
  studentId: string;
  completedAt: string;
  score: number;
  totalPoints: number;
  percentage: number;
  answers: { [qId: string]: number };
}

export function saveOfflineAttempt(attempt: OfflineAttemptRecord) {
  try {
    const raw = localStorage.getItem(OFFLINE_ATTEMPTS_KEY);
    const list: OfflineAttemptRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(attempt);
    localStorage.setItem(OFFLINE_ATTEMPTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save offline attempt', e);
  }
}

export function getOfflineAttempts(): OfflineAttemptRecord[] {
  try {
    const raw = localStorage.getItem(OFFLINE_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
