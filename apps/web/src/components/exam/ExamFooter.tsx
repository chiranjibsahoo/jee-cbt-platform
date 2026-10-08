import { useExamStore } from '../../store/examStore';

export default function ExamFooter() {
  const { exam, session, clearResponse, markAndNext, saveAndNext, setShowSubmitModal, goPrev } = useExamStore();

  if (!exam || !session) return null;

  let currentEq = null;
  let globalIdx = 0;
  for (const section of exam.sections) {
    const end = globalIdx + section.questions.length;
    if (session.currentQuestionIndex < end) {
      currentEq = section.questions[session.currentQuestionIndex - globalIdx];
      break;
    }
    globalIdx = end;
  }

  if (!currentEq) return null;
  const questionId = currentEq.questionId;

  return (
    <>
      {/* Main footer (left of palette) */}
      <footer className="fixed bottom-0 left-0 right-80 bg-gray-900/95 backdrop-blur-md border-t border-gray-700/80 px-5 py-3 flex items-center justify-between z-10 shadow-xl">
        {/* Left actions */}
        <div className="flex gap-2">
          <button
            onClick={() => markAndNext(questionId)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-violet-900/50 hover:-translate-y-0.5"
          >
            <span className="text-violet-200">⚑</span>
            MARK & REVIEW
          </button>
          <button
            onClick={() => clearResponse(questionId)}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-600"
          >
            CLEAR
          </button>
        </div>

        {/* Right nav actions */}
        <div className="flex gap-2 items-center">
          <button
            onClick={goPrev}
            className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-xs font-bold transition-all border border-gray-600"
          >
            ← PREV
          </button>
          <button
            onClick={() => saveAndNext(questionId)}
            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-emerald-900/50 hover:-translate-y-0.5"
          >
            SAVE & NEXT →
          </button>
        </div>
      </footer>

      {/* Submit button — lives in palette column bottom */}
      <div className="fixed bottom-0 right-0 w-80 bg-gray-900 border-t border-l border-gray-700/80 p-3 z-10">
        <button
          onClick={() => setShowSubmitModal(true)}
          className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl font-black text-sm tracking-wider transition-all shadow-lg hover:shadow-rose-900/60 hover:-translate-y-0.5"
        >
          SUBMIT TEST
        </button>
      </div>
    </>
  );
}
