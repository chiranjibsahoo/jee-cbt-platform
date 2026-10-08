import { ExamAttempt, AttemptAnswer, Question, QuestionOption, ExamConfig } from '@prisma/client';

type AnswerWithQuestion = AttemptAnswer & {
  question: Question & { options: QuestionOption[] };
};

type AttemptWithAll = ExamAttempt & {
  answers: AnswerWithQuestion[];
  exam: {
    config: ExamConfig | null;
    sections: Array<{
      subject: string;
      questions: Array<{ questionId: string }>;
    }>;
  };
};

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
  subjectScores: Record<string, { score: number; max: number; correct: number; incorrect: number; unanswered: number }>;
  chapterScores: Record<string, { score: number; max: number; correct: number; incorrect: number; unanswered: number }>;
}

export async function calculateScore(attempt: AttemptWithAll): Promise<ScoreResult> {
  const config = attempt.exam.config;
  const defaultCorrect = config?.correctMarks ?? 4;
  const defaultIncorrect = config?.incorrectMarks ?? -1;

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const answerResults: ScoreResult['answerResults'] = [];
  const subjectScores: ScoreResult['subjectScores'] = {};
  const chapterScores: ScoreResult['chapterScores'] = {};

  // Build max score from all questions
  let maxScore = 0;

  for (const answer of attempt.answers) {
    const q = answer.question;
    const subject = answer.subject;
    const chapter = q.chapter;
    const correctMarks = q.correctMarks ?? defaultCorrect;
    const negativeMarks = Math.abs(q.negativeMarks ?? Math.abs(defaultIncorrect));

    maxScore += correctMarks;

    // Initialize subject/chapter tracking
    if (!subjectScores[subject]) {
      subjectScores[subject] = { score: 0, max: 0, correct: 0, incorrect: 0, unanswered: 0 };
    }
    subjectScores[subject].max += correctMarks;

    if (!chapterScores[chapter]) {
      chapterScores[chapter] = { score: 0, max: 0, correct: 0, incorrect: 0, unanswered: 0 };
    }
    chapterScores[chapter].max += correctMarks;

    const isAnswered = answer.selectedOptions || answer.numericalAnswer !== null;
    if (!isAnswered || answer.status === 'NOT_VISITED' || answer.status === 'NOT_ANSWERED') {
      unansweredCount++;
      subjectScores[subject].unanswered++;
      chapterScores[chapter].unanswered++;
      answerResults.push({ questionId: q.id, isCorrect: null, marksAwarded: 0 });
      continue;
    }

    let isCorrect = false;
    let marksAwarded = 0;

    if (q.questionType === 'NUMERICAL') {
      const correctOption = q.options.find(o => o.isCorrect);
      const correctNumerical = correctOption ? parseFloat(correctOption.optionText) : null;
      if (answer.numericalAnswer !== null && correctNumerical !== null) {
        isCorrect = Math.abs(answer.numericalAnswer - correctNumerical) < 0.001;
      }
      marksAwarded = isCorrect ? correctMarks : -negativeMarks;
    } else if (q.questionType === 'MCQ_SINGLE') {
      const correctOption = q.options.find(o => o.isCorrect);
      const selectedStr = answer.selectedOptions ? JSON.parse(answer.selectedOptions) : [];
      isCorrect = selectedStr.length === 1 && selectedStr[0] === correctOption?.optionLabel;
      marksAwarded = isCorrect ? correctMarks : -negativeMarks;
    } else if (q.questionType === 'MCQ_MULTIPLE') {
      const correctLabels = q.options.filter(o => o.isCorrect).map(o => o.optionLabel).sort();
      const selectedStr = answer.selectedOptions ? JSON.parse(answer.selectedOptions) : [];
      const selectedSorted = [...selectedStr].sort();
      isCorrect = JSON.stringify(correctLabels) === JSON.stringify(selectedSorted);

      if (isCorrect) {
        marksAwarded = correctMarks;
      } else if (selectedStr.length > 0) {
        // Partial marking for MCQ multiple
        const correctSelected = selectedStr.filter((s: string) => correctLabels.includes(s)).length;
        const wrongSelected = selectedStr.filter((s: string) => !correctLabels.includes(s)).length;
        if (wrongSelected > 0) {
          marksAwarded = -negativeMarks;
        } else {
          // Partial credit
          marksAwarded = (correctSelected / correctLabels.length) * correctMarks;
        }
      }
    }

    totalScore += marksAwarded;

    if (isCorrect) {
      correctCount++;
      subjectScores[subject].correct++;
      chapterScores[chapter].correct++;
    } else {
      incorrectCount++;
      subjectScores[subject].incorrect++;
      chapterScores[chapter].incorrect++;
    }

    subjectScores[subject].score += marksAwarded;
    chapterScores[chapter].score += marksAwarded;

    answerResults.push({ questionId: q.id, isCorrect, marksAwarded });
  }

  return {
    totalScore,
    maxScore,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions: attempt.answers.length,
    answerResults,
    subjectScores,
    chapterScores,
  };
}
