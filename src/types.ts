export type QuestionType = 'multiple-choice' | 'true-false';

export interface Question {
  id: string;
  text: string;
  type?: QuestionType;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  timeLimitSeconds: number;
  points: number;
  topicTag?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  imageUrl?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel?: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  defaultTimeLimit: number;
  tags: string[];
  totalPoints: number;
}

export interface StudentParticipant {
  id: string;
  name: string;
  avatar: string;
  studentId?: string;
  score: number;
  streak: number;
  highestStreak: number;
  answers: {
    [questionId: string]: {
      selectedOptionIndex: number;
      isCorrect: boolean;
      timeSpentMs: number;
      pointsEarned: number;
      submittedAt: number;
    };
  };
  connected: boolean;
  isBot?: boolean;
}

export type RoomPhase =
  | 'lobby'
  | 'question'
  | 'percentages'
  | 'leaderboard'
  | 'final_results';

export interface LiveRoom {
  pin: string;
  quizId: string;
  quizTitle: string;
  quiz: Quiz;
  hostName: string;
  hostEmail?: string;
  createdAt: number;
  currentQuestionIndex: number;
  phase: RoomPhase;
  timerStartedAt: number | null;
  timerRemainingSeconds: number;
  isTimerPaused: boolean;
  overrideBonusPoints?: number;
  activeHint?: string;
  participants: { [participantId: string]: StudentParticipant };
  settings: {
    showLivePercentages: boolean;
    streakBonus: boolean;
    speedBonus: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    musicSoundEnabled: boolean;
    allowLateJoin: boolean;
  };
}

export interface GradeReportEntry {
  studentName: string;
  studentId: string;
  email?: string;
  score: number;
  totalPossible: number;
  percentage: number;
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  correctCount: number;
  totalQuestions: number;
  averageResponseTimeSeconds: number;
  status: 'Turned In' | 'Late' | 'Excused';
  strengths: string[];
  needsReview: string[];
}

export interface ClassroomSyncPayload {
  courseId: string;
  courseName: string;
  assignmentTitle: string;
  maxPoints: number;
  dueDate?: string;
  grades: GradeReportEntry[];
}

export interface TeachingAssistant {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  department: string;
  avatar: string;
  accessCode: string;
}
