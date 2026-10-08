// ===================== ENUMS =====================
export type ExamType = 'JEE_MAIN' | 'JEE_ADVANCED' | 'CUSTOM';
export type ExamMode = 'FULL_TEST' | 'SUBJECT_TEST' | 'CHAPTER_TEST' | 'CUSTOM_TEST' | 'PREVIOUS_YEAR';
export type Subject = 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS';
export type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'NUMERICAL' | 'ASSERTION_REASON' | 'PASSAGE' | 'MATRIX_MATCH';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionStatus = 'NOT_VISITED' | 'NOT_ANSWERED' | 'ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'ABANDONED';
export type MistakeType = 'CONCEPTUAL' | 'CALCULATION' | 'SILLY' | 'TIME_MANAGEMENT' | 'FORMULA_FORGOTTEN' | 'GUESSING_ERROR';
export type UserRole = 'STUDENT' | 'ADMIN';

// ===================== USER =====================
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

// ===================== QUESTION =====================
export interface QuestionOption {
  id: string;
  questionId: string;
  optionLabel: string;
  optionText: string;
  imageUrl?: string;
  isCorrect: boolean;
  order: number;
}

export interface Question {
  id: string;
  examType?: ExamType;
  subject: Subject;
  chapter: string;
  topic?: string;
  questionType: QuestionType;
  questionText: string;
  imageUrl?: string;
  difficulty: Difficulty;
  correctMarks: number;
  negativeMarks: number;
  source?: string;
  year?: number;
  shift?: string;
  isPYQ: boolean;
  solution?: string;
  explanation?: string;
  formulaUsed?: string;
  tags?: string;
  options: QuestionOption[];
  createdAt: string;
}

// ===================== EXAM =====================
export interface ExamConfig {
  id: string;
  examId: string;
  correctMarks: number;
  incorrectMarks: number;
  unansweredMarks: number;
  partialMarking: boolean;
  examSecurityMode: string;
  allowCalculator: boolean;
  shuffleQuestions: boolean;
}

export interface ExamQuestion {
  id: string;
  questionId: string;
  sectionId: string;
  order: number;
  question: Question;
}

export interface ExamSection {
  id: string;
  examId: string;
  name: string;
  subject: Subject;
  questionCount: number;
  correctMarks?: number;
  incorrectMarks?: number;
  order: number;
  questions: ExamQuestion[];
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  examType: ExamType;
  mode: ExamMode;
  duration: number; // minutes
  totalMarks: number;
  isPublished: boolean;
  isDemo: boolean;
  year?: number;
  sections: ExamSection[];
  config?: ExamConfig;
  createdAt: string;
}

// ===================== ATTEMPT =====================
export interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  questionIndex: number;
  subject: Subject;
  status: QuestionStatus;
  selectedOptions?: string; // JSON string
  numericalAnswer?: number;
  isCorrect?: boolean;
  marksAwarded?: number;
  timeSpent: number;
  visitCount: number;
  question: Question;
}

export interface AttemptEvent {
  id: string;
  attemptId: string;
  eventType: string;
  payload?: string;
  timestamp: string;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  status: AttemptStatus;
  startTime: string;
  endTime?: string;
  submittedAt?: string;
  timeAllowed: number; // seconds
  timeUsed: number;
  currentQuestion: number;
  currentSubject: Subject;
  totalScore: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  answers: AttemptAnswer[];
  exam: Exam;
  events?: AttemptEvent[];
}

// ===================== LOCAL EXAM STATE =====================
export interface LocalAnswer {
  questionId: string;
  questionIndex: number;
  subject: Subject;
  status: QuestionStatus;
  selectedOptions: string[];
  numericalAnswer: string;
  timeSpent: number;
  visitedAt?: number;
}

export interface ExamSessionState {
  attemptId: string;
  examId: string;
  startTime: number; // unix ms
  endTime: number; // unix ms (when exam expires)
  timeAllowed: number; // seconds
  currentQuestionIndex: number;
  currentSubject: Subject;
  answers: Record<string, LocalAnswer>; // keyed by questionId
  isSubmitted: boolean;
  lastSyncAt: number;
}

// ===================== RESULT =====================
export interface SubjectScore {
  score: number;
  max: number;
  correct: number;
  incorrect: number;
  unanswered: number;
}

export interface ScoreResult {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  answerResults: Array<{
    questionId: string;
    isCorrect: boolean | null;
    marksAwarded: number;
  }>;
  subjectScores: Record<string, SubjectScore>;
  chapterScores: Record<string, SubjectScore>;
}

// ===================== ANALYTICS =====================
export interface DashboardData {
  totalAttempts: number;
  avgScore: number;
  bestScore: number;
  avgAccuracy: number;
  totalQuestionsAttempted: number;
  strongestSubject: string;
  weakestSubject: string;
  recentAttempts: ExamAttempt[];
  performanceTrend: Array<{
    date: string;
    score: number;
    maxScore: number;
    percentage: number;
    accuracy: number;
    examTitle: string;
  }>;
}

export interface ChapterAnalysis {
  chapter: string;
  subject: string;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  accuracy: number;
}

// ===================== BOOKMARK & MISTAKE =====================
export interface Bookmark {
  id: string;
  userId: string;
  questionId: string;
  note?: string;
  createdAt: string;
  question: Question;
}

export interface Mistake {
  id: string;
  userId: string;
  questionId: string;
  attemptId?: string;
  mistakeType: MistakeType;
  note?: string;
  isResolved: boolean;
  createdAt: string;
  question: Question;
}
