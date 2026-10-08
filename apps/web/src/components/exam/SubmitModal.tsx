import { useExamStore } from '../../store/examStore';
import { AlertTriangle, Clock } from 'lucide-react';

export default function SubmitModal() {
  const { showSubmitModal, setShowSubmitModal, submitExam, getAnswerStats } = useExamStore();

  if (!showSubmitModal) return null;

  const stats = getAnswerStats();
  const total =
    stats.answered + stats.notAnswered + stats.markedReview + stats.answeredMarked + stats.notVisited;

  // Estimate time used (not available directly; placeholder)
  const timeUsed = '—';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-rose-800 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-700/60 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Submit Examination</h2>
            <p className="text-xs text-rose-300">This action cannot be undone</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Are you sure you want to submit the examination? You will{' '}
            <span className="text-rose-400 font-semibold">not</span> be able to change your
            answers after submission.
          </p>

          {/* Stats grid — 4 cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Answered */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">
                Answered
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {stats.answered + stats.answeredMarked}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">out of {total}</div>
            </div>

            {/* Not Answered */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">
                Not Answered
              </div>
              <div className="text-3xl font-extrabold text-red-400">
                {stats.notAnswered + stats.notVisited}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">including not visited</div>
            </div>

            {/* Marked for Review */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">
                Marked
              </div>
              <div className="text-3xl font-extrabold text-violet-400">
                {stats.markedReview}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">for review</div>
            </div>

            {/* Time */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </div>
              <div className="text-3xl font-extrabold text-blue-400">{timeUsed}</div>
              <div className="text-[10px] text-gray-600 mt-1">time elapsed</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => submitExam()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white text-sm font-bold transition-all shadow-lg shadow-rose-900/40"
            >
              SUBMIT TEST
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
