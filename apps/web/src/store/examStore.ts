import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exam, ExamAttempt, LocalAnswer, QuestionStatus, Subject, ExamSessionState } from '../types';
// Note: Exam type is used in helper functions below
import { attemptsApi } from '../lib/api';

const SYNC_INTERVAL = 15000; // sync every 15 seconds

interface ExamStore {
  // Active session
  session: ExamSessionState | null;
  exam: Exam | null;
  attempt: ExamAttempt | null;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  
  // UI state (not persisted)
  showSubmitModal: boolean;
  isFullscreen: boolean;
  showKeyboardHelp: boolean;
  timerWarningShown: Record<string, boolean>;

  // Actions
  startExam: (examId: string) => Promise<{ attemptId: string; resumed: boolean }>;
  resumeExam: (attemptId: string) => Promise<void>;
  
  // Navigation
  goToQuestion: (index: number) => void;
  goToSubject: (subject: Subject) => void;
  goNext: () => void;
  goPrev: () => void;
  
  // Answer actions
  selectOption: (questionId: string, optionLabel: string) => void;
  setNumericalAnswer: (questionId: string, value: string) => void;
  clearResponse: (questionId: string) => void;
  markForReview: (questionId: string) => void;
  saveAndNext: (questionId: string) => void;
  markAndNext: (questionId: string) => void;
  
  // Status
  getQuestionStatus: (questionId: string) => QuestionStatus;
  getAnswerStats: () => { answered: number; notAnswered: number; markedReview: number; answeredMarked: number; notVisited: number };
  getSubjectStats: (subject: Subject) => { answered: number; notAnswered: number; markedReview: number; answeredMarked: number; notVisited: number };
  getCurrentAnswer: (questionId: string) => LocalAnswer | undefined;
  getTimeRemaining: () => number;
  
  // Submission
  submitExam: (autoSubmit?: boolean) => Promise<void>;
  setShowSubmitModal: (show: boolean) => void;
  setIsFullscreen: (fs: boolean) => void;
  setShowKeyboardHelp: (show: boolean) => void;
  setTimerWarning: (key: string) => void;
  
  // Sync
  syncAnswers: () => Promise<void>;
  clearSession: () => void;
}

let syncTimer: number | null = null;

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      session: null,
      exam: null,
      attempt: null,
      isLoading: false,
      error: null,
      isSyncing: false,
      showSubmitModal: false,
      isFullscreen: false,
      showKeyboardHelp: false,
      timerWarningShown: {},

      startExam: async (examId) => {
        set({ isLoading: true, error: null });
        try {
          const res = await attemptsApi.start(examId);
          const { attempt, timeRemaining, resumed } = res.data;
          
          const now = Date.now();
          const endTime = now + (timeRemaining * 1000);

          // Build initial answers map
          const answersMap: Record<string, LocalAnswer> = {};
          let globalIndex = 0;
          
          for (const section of attempt.exam.sections) {
            for (const eq of section.questions) {
              const existingAnswer = attempt.answers?.find((a: any) => a.questionId === eq.questionId);
              answersMap[eq.questionId] = {
                questionId: eq.questionId,
                questionIndex: globalIndex,
                subject: section.subject as Subject,
                status: existingAnswer?.status || 'NOT_VISITED',
                selectedOptions: existingAnswer?.selectedOptions 
                  ? JSON.parse(existingAnswer.selectedOptions) 
                  : [],
                numericalAnswer: existingAnswer?.numericalAnswer?.toString() || '',
                timeSpent: existingAnswer?.timeSpent || 0,
                visitedAt: Date.now(),
              };
              globalIndex++;
            }
          }

          const session: ExamSessionState = {
            attemptId: attempt.id,
            examId,
            startTime: new Date(attempt.startTime).getTime(),
            endTime,
            timeAllowed: attempt.timeAllowed,
            currentQuestionIndex: resumed ? attempt.currentQuestion : 0,
            currentSubject: (resumed ? attempt.currentSubject : attempt.exam.sections[0]?.subject || 'PHYSICS') as Subject,
            answers: answersMap,
            isSubmitted: false,
            lastSyncAt: Date.now(),
          };

          set({ session, exam: attempt.exam, attempt, isLoading: false });

          // Start auto-sync
          startAutoSync(get, set);

          return { attemptId: attempt.id, resumed };
        } catch (err: any) {
          set({ isLoading: false, error: err.response?.data?.error || 'Failed to start exam' });
          throw err;
        }
      },

      resumeExam: async (attemptId) => {
        set({ isLoading: true, error: null });
        try {
          const res = await attemptsApi.get(attemptId);
          const { attempt, timeRemaining } = res.data;

          const now = Date.now();
          const endTime = now + (timeRemaining * 1000);

          const answersMap: Record<string, LocalAnswer> = {};
          let globalIndex = 0;

          for (const section of attempt.exam.sections) {
            for (const eq of section.questions) {
              const existingAnswer = attempt.answers?.find((a: any) => a.questionId === eq.questionId);
              answersMap[eq.questionId] = {
                questionId: eq.questionId,
                questionIndex: globalIndex,
                subject: section.subject as Subject,
                status: existingAnswer?.status || 'NOT_VISITED',
                selectedOptions: existingAnswer?.selectedOptions
                  ? JSON.parse(existingAnswer.selectedOptions)
                  : [],
                numericalAnswer: existingAnswer?.numericalAnswer?.toString() || '',
                timeSpent: existingAnswer?.timeSpent || 0,
              };
              globalIndex++;
            }
          }

          const session: ExamSessionState = {
            attemptId,
            examId: attempt.examId,
            startTime: new Date(attempt.startTime).getTime(),
            endTime,
            timeAllowed: attempt.timeAllowed,
            currentQuestionIndex: attempt.currentQuestion,
            currentSubject: attempt.currentSubject as Subject,
            answers: answersMap,
            isSubmitted: false,
            lastSyncAt: Date.now(),
          };

          set({ session, exam: attempt.exam, attempt, isLoading: false });
          startAutoSync(get, set);
        } catch (err: any) {
          set({ isLoading: false, error: err.response?.data?.error || 'Failed to resume exam' });
          throw err;
        }
      },

      goToQuestion: (index) => {
        const { session, exam } = get();
        if (!session || !exam) return;

        // Find which subject this question belongs to
        let globalIdx = 0;
        let targetSubject = session.currentSubject;
        
        for (const section of exam.sections) {
          for (const eq of section.questions) {
            if (globalIdx === index) {
              targetSubject = section.subject as Subject;
              // Mark current question as visited if not already
              const prevQ = Object.values(session.answers)[session.currentQuestionIndex];
              if (prevQ && prevQ.status === 'NOT_VISITED') {
                // Will be handled by updateAnswerStatus
              }
              break;
            }
            globalIdx++;
          }
        }

        // Get the question at the new index
        const newQuestion = getQuestionAtIndex(exam, index);
        if (newQuestion) {
          const answer = session.answers[newQuestion.question.id];
          if (answer && answer.status === 'NOT_VISITED') {
            set(state => ({
              session: state.session ? {
                ...state.session,
                currentQuestionIndex: index,
                currentSubject: targetSubject,
                answers: {
                  ...state.session.answers,
                  [newQuestion.question.id]: {
                    ...answer,
                    status: 'NOT_ANSWERED',
                    visitedAt: Date.now(),
                  },
                },
              } : null,
            }));
          } else {
            set(state => ({
              session: state.session ? {
                ...state.session,
                currentQuestionIndex: index,
                currentSubject: targetSubject,
              } : null,
            }));
          }
        }
      },

      goToSubject: (subject) => {
        const { session, exam } = get();
        if (!session || !exam) return;

        let globalIdx = 0;
        for (const section of exam.sections) {
          if (section.subject === subject) {
            set(state => ({
              session: state.session ? {
                ...state.session,
                currentSubject: subject,
                currentQuestionIndex: globalIdx,
              } : null,
            }));
            return;
          }
          globalIdx += section.questions.length;
        }
      },

      goNext: () => {
        const { session, exam } = get();
        if (!session || !exam) return;
        const total = getTotalQuestions(exam);
        if (session.currentQuestionIndex < total - 1) {
          get().goToQuestion(session.currentQuestionIndex + 1);
        }
      },

      goPrev: () => {
        const { session } = get();
        if (!session) return;
        if (session.currentQuestionIndex > 0) {
          get().goToQuestion(session.currentQuestionIndex - 1);
        }
      },

      selectOption: (questionId, optionLabel) => {
        const { session, exam } = get();
        if (!session) return;

        const answer = session.answers[questionId];
        if (!answer) return;

        // Determine question type
        const question = findQuestion(exam!, questionId);
        let newSelected: string[];

        if (question?.questionType === 'MCQ_MULTIPLE') {
          // Toggle in multiple select
          if (answer.selectedOptions.includes(optionLabel)) {
            newSelected = answer.selectedOptions.filter(o => o !== optionLabel);
          } else {
            newSelected = [...answer.selectedOptions, optionLabel];
          }
        } else {
          // Single select
          newSelected = answer.selectedOptions[0] === optionLabel ? [] : [optionLabel];
        }

        const hasAnswer = newSelected.length > 0;
        const isMarked = answer.status === 'MARKED_FOR_REVIEW' || answer.status === 'ANSWERED_AND_MARKED';
        
        let newStatus: QuestionStatus;
        if (hasAnswer && isMarked) newStatus = 'ANSWERED_AND_MARKED';
        else if (hasAnswer) newStatus = 'ANSWERED';
        else if (isMarked) newStatus = 'MARKED_FOR_REVIEW';
        else newStatus = 'NOT_ANSWERED';

        set(state => ({
          session: state.session ? {
            ...state.session,
            answers: {
              ...state.session.answers,
              [questionId]: {
                ...answer,
                selectedOptions: newSelected,
                status: newStatus,
              },
            },
          } : null,
        }));
      },

      setNumericalAnswer: (questionId, value) => {
        const { session } = get();
        if (!session) return;

        const answer = session.answers[questionId];
        if (!answer) return;

        const hasValue = value !== '' && value !== null;
        const isMarked = answer.status === 'MARKED_FOR_REVIEW' || answer.status === 'ANSWERED_AND_MARKED';

        let newStatus: QuestionStatus;
        if (hasValue && isMarked) newStatus = 'ANSWERED_AND_MARKED';
        else if (hasValue) newStatus = 'ANSWERED';
        else if (isMarked) newStatus = 'MARKED_FOR_REVIEW';
        else newStatus = 'NOT_ANSWERED';

        set(state => ({
          session: state.session ? {
            ...state.session,
            answers: {
              ...state.session.answers,
              [questionId]: {
                ...answer,
                numericalAnswer: value,
                status: newStatus,
              },
            },
          } : null,
        }));
      },

      clearResponse: (questionId) => {
        const { session } = get();
        if (!session) return;

        const answer = session.answers[questionId];
        if (!answer) return;

        const isMarked = answer.status === 'MARKED_FOR_REVIEW' || answer.status === 'ANSWERED_AND_MARKED';
        const newStatus: QuestionStatus = isMarked ? 'MARKED_FOR_REVIEW' : 'NOT_ANSWERED';

        set(state => ({
          session: state.session ? {
            ...state.session,
            answers: {
              ...state.session.answers,
              [questionId]: {
                ...answer,
                selectedOptions: [],
                numericalAnswer: '',
                status: newStatus,
              },
            },
          } : null,
        }));
      },

      markForReview: (questionId) => {
        const { session } = get();
        if (!session) return;

        const answer = session.answers[questionId];
        if (!answer) return;

        const hasAnswer = answer.selectedOptions.length > 0 || answer.numericalAnswer !== '';
        const isMarked = answer.status === 'MARKED_FOR_REVIEW' || answer.status === 'ANSWERED_AND_MARKED';

        let newStatus: QuestionStatus;
        if (isMarked) {
          // Unmark
          newStatus = hasAnswer ? 'ANSWERED' : 'NOT_ANSWERED';
        } else {
          // Mark
          newStatus = hasAnswer ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW';
        }

        set(state => ({
          session: state.session ? {
            ...state.session,
            answers: {
              ...state.session.answers,
              [questionId]: { ...answer, status: newStatus },
            },
          } : null,
        }));
      },

      saveAndNext: (questionId) => {
        const { session } = get();
        if (!session) return;

        const answer = session.answers[questionId];
        if (answer) {
          const hasAnswer = answer.selectedOptions.length > 0 || answer.numericalAnswer !== '';
          if (answer.status !== 'MARKED_FOR_REVIEW' && answer.status !== 'ANSWERED_AND_MARKED') {
            set(state => ({
              session: state.session ? {
                ...state.session,
                answers: {
                  ...state.session.answers,
                  [questionId]: {
                    ...answer,
                    status: hasAnswer ? 'ANSWERED' : 'NOT_ANSWERED',
                  },
                },
              } : null,
            }));
          }
        }
        get().goNext();
      },

      markAndNext: (questionId) => {
        const { session } = get();
        if (!session) return;

        const answer = session.answers[questionId];
        if (answer) {
          const hasAnswer = answer.selectedOptions.length > 0 || answer.numericalAnswer !== '';
          set(state => ({
            session: state.session ? {
              ...state.session,
              answers: {
                ...state.session.answers,
                [questionId]: {
                  ...answer,
                  status: hasAnswer ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW',
                },
              },
            } : null,
          }));
        }
        get().goNext();
      },

      getQuestionStatus: (questionId) => {
        const { session } = get();
        return session?.answers[questionId]?.status || 'NOT_VISITED';
      },

      getCurrentAnswer: (questionId) => {
        const { session } = get();
        return session?.answers[questionId];
      },

      getTimeRemaining: () => {
        const { session } = get();
        if (!session) return 0;
        const remaining = Math.floor((session.endTime - Date.now()) / 1000);
        return Math.max(0, remaining);
      },

      getAnswerStats: () => {
        const { session } = get();
        if (!session) return { answered: 0, notAnswered: 0, markedReview: 0, answeredMarked: 0, notVisited: 0 };
        
        const stats = { answered: 0, notAnswered: 0, markedReview: 0, answeredMarked: 0, notVisited: 0 };
        for (const ans of Object.values(session.answers)) {
          switch (ans.status) {
            case 'ANSWERED': stats.answered++; break;
            case 'NOT_ANSWERED': stats.notAnswered++; break;
            case 'MARKED_FOR_REVIEW': stats.markedReview++; break;
            case 'ANSWERED_AND_MARKED': stats.answeredMarked++; break;
            default: stats.notVisited++;
          }
        }
        return stats;
      },

      getSubjectStats: (subject) => {
        const { session } = get();
        if (!session) return { answered: 0, notAnswered: 0, markedReview: 0, answeredMarked: 0, notVisited: 0 };
        
        const stats = { answered: 0, notAnswered: 0, markedReview: 0, answeredMarked: 0, notVisited: 0 };
        for (const ans of Object.values(session.answers)) {
          if (ans.subject !== subject) continue;
          switch (ans.status) {
            case 'ANSWERED': stats.answered++; break;
            case 'NOT_ANSWERED': stats.notAnswered++; break;
            case 'MARKED_FOR_REVIEW': stats.markedReview++; break;
            case 'ANSWERED_AND_MARKED': stats.answeredMarked++; break;
            default: stats.notVisited++;
          }
        }
        return stats;
      },

      submitExam: async (autoSubmit = false) => {
        const { session } = get();
        if (!session) return;

        // Sync all answers first
        await get().syncAnswers();

        set({ isLoading: true, showSubmitModal: false });
        try {
          const res = await attemptsApi.submit(session.attemptId, autoSubmit);
          set(state => ({
            session: state.session ? { ...state.session, isSubmitted: true } : null,
            attempt: res.data.attempt,
            isLoading: false,
          }));
          stopAutoSync();
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      syncAnswers: async () => {
        const { session } = get();
        if (!session || session.isSubmitted) return;

        set({ isSyncing: true });
        try {
          const answersToSync = Object.values(session.answers).map(a => ({
            questionId: a.questionId,
            questionIndex: a.questionIndex,
            subject: a.subject,
            status: a.status,
            selectedOptions: a.selectedOptions.length > 0 ? a.selectedOptions : undefined,
            numericalAnswer: a.numericalAnswer !== '' ? parseFloat(a.numericalAnswer) : undefined,
            timeSpent: a.timeSpent,
          }));

          await attemptsApi.sync(session.attemptId, {
            answers: answersToSync,
            currentQuestion: session.currentQuestionIndex,
            currentSubject: session.currentSubject,
          });

          set(state => ({
            session: state.session ? { ...state.session, lastSyncAt: Date.now() } : null,
            isSyncing: false,
          }));
        } catch {
          set({ isSyncing: false });
        }
      },

      setShowSubmitModal: (show) => set({ showSubmitModal: show }),
      setIsFullscreen: (fs) => set({ isFullscreen: fs }),
      setShowKeyboardHelp: (show) => set({ showKeyboardHelp: show }),
      setTimerWarning: (key) => set(state => ({
        timerWarningShown: { ...state.timerWarningShown, [key]: true },
      })),

      clearSession: () => {
        stopAutoSync();
        set({ session: null, exam: null, attempt: null, error: null, timerWarningShown: {} });
      },
    }),
    {
      name: 'jee-exam-session',
      partialize: (state) => ({ session: state.session }),
    }
  )
);

// Auto-sync helper
function startAutoSync(get: () => ExamStore, set: (fn: any) => void) {
  stopAutoSync();
  syncTimer = window.setInterval(() => {
    const { session } = get();
    if (session && !session.isSubmitted) {
      get().syncAnswers();
    }
  }, SYNC_INTERVAL);
}

function stopAutoSync() {
  if (syncTimer !== null) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

// Helper functions
function getTotalQuestions(exam: Exam): number {
  return exam.sections.reduce((sum, s) => sum + s.questions.length, 0);
}

function getQuestionAtIndex(exam: Exam, index: number) {
  let i = 0;
  for (const section of exam.sections) {
    for (const eq of section.questions) {
      if (i === index) return eq;
      i++;
    }
  }
  return null;
}

function findQuestion(exam: Exam, questionId: string) {
  for (const section of exam.sections) {
    for (const eq of section.questions) {
      if (eq.questionId === questionId) return eq.question;
    }
  }
  return null;
}


