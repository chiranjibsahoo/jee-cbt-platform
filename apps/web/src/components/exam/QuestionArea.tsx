import { useExamStore } from '../../store/examStore';
import { useRef } from 'react';

export default function QuestionArea() {
  const { exam, session, selectOption, setNumericalAnswer } = useExamStore();
  const textRef = useRef<HTMLDivElement>(null);

  if (!exam || !session) return null;

  let currentEq = null;
  let qNumber = 0;
  let sectionName = '';
  let globalIdx = 0;
  let totalInSection = 0;

  for (const section of exam.sections) {
    const end = globalIdx + section.questions.length;
    if (globalIdx <= session.currentQuestionIndex && session.currentQuestionIndex < end) {
      const localIdx = session.currentQuestionIndex - globalIdx;
      currentEq = section.questions[localIdx];
      qNumber = localIdx + 1;
      sectionName = section.name;
      totalInSection = section.questions.length;
      break;
    }
    globalIdx = end;
  }

  if (!currentEq) return <div className="flex-1 flex items-center justify-center text-gray-500">No question found</div>;

  const question = currentEq.question;
  const answer = session.answers[question.id];

  const handleNumericalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      setNumericalAnswer(question.id, val);
    }
  };

  const difficultyColor =
    question.difficulty === 'EASY'   ? 'text-emerald-400 bg-emerald-900/30 border-emerald-800' :
    question.difficulty === 'HARD'   ? 'text-red-400 bg-red-900/30 border-red-800' :
                                       'text-amber-400 bg-amber-900/30 border-amber-800';

  return (
    <div className="flex-1 overflow-y-auto bg-[#111827] pb-24" ref={textRef}>
      <div className="max-w-3xl mx-auto px-6 py-6">

        {/* Question Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-900/40">
              {qNumber}
            </div>
            <div>
              <p className="text-white font-bold text-base">Question {qNumber}</p>
              <p className="text-xs text-gray-500 font-medium">{sectionName} · Q{qNumber} of {totalInSection}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${difficultyColor}`}>
              {question.difficulty}
            </span>
            <span className="text-xs font-semibold text-gray-400 bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-lg">
              {question.questionType.replace(/_/g, ' ')}
            </span>
            <div className="text-xs font-bold bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-lg flex gap-2">
              <span className="text-emerald-400">+{question.correctMarks}</span>
              <span className="text-gray-600">|</span>
              <span className="text-red-400">{question.negativeMarks}</span>
            </div>
          </div>
        </div>

        {/* Question Text */}
        <div className="text-[15px] text-gray-100 leading-relaxed font-medium mb-8 p-5 bg-gray-800/40 rounded-xl border border-gray-700/50">
          {question.questionText}
          {question.imageUrl && (
            <div className="mt-5">
              <img
                src={question.imageUrl}
                alt="Question Diagram"
                className="max-w-full max-h-80 object-contain rounded-xl border border-gray-700 shadow-md"
              />
            </div>
          )}
        </div>

        {/* MCQ Options */}
        {(question.questionType === 'MCQ_SINGLE' || question.questionType === 'MCQ_MULTIPLE') && (
          <div className="space-y-3">
            {question.questionType === 'MCQ_MULTIPLE' && (
              <div className="text-xs font-bold text-orange-400 bg-orange-900/20 border border-orange-900/40 px-3 py-2 rounded-lg mb-4">
                ⚡ Multiple correct options may apply. Select all that are correct.
              </div>
            )}
            {question.options.map((option: any) => {
              const isSelected = answer?.selectedOptions?.includes(option.optionLabel);
              return (
                <div
                  key={option.id}
                  className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-150 border-2 group
                    ${isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-900/20'
                      : 'bg-gray-800/60 border-gray-700/50 text-gray-200 hover:border-gray-500 hover:bg-gray-800'
                    }`}
                  onClick={() => selectOption(question.id, option.optionLabel)}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg font-black text-sm shrink-0 transition-all
                    ${isSelected
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 group-hover:bg-gray-600'
                    }`}>
                    {option.optionLabel}
                  </div>
                  <div className="text-[15px] leading-relaxed pt-1">{option.optionText}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Numerical Answer */}
        {question.questionType === 'NUMERICAL' && (
          <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6">
            <p className="text-gray-400 text-sm font-semibold mb-4">Enter your numerical answer:</p>
            <div className="flex items-center gap-4">
              <input
                type="text"
                inputMode="decimal"
                value={answer?.numericalAnswer || ''}
                onChange={handleNumericalChange}
                placeholder="0.00"
                className="w-52 px-4 py-3 text-2xl font-mono font-bold rounded-xl border-2 border-gray-600 bg-gray-900 text-white placeholder-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-inner"
              />
              {answer?.numericalAnswer && (
                <div className="bg-blue-600/20 border border-blue-500/40 text-blue-400 text-sm font-bold px-3 py-2 rounded-lg">
                  Answer: {answer.numericalAnswer}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chapter / Topic tag */}
        {question.chapter && (
          <div className="mt-8 pt-4 border-t border-gray-800/60 flex gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Chapter:</span>
            <span className="text-[10px] text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-md">{question.chapter}</span>
            {question.topic && <span className="text-[10px] text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-md">{question.topic}</span>}
          </div>
        )}

      </div>
    </div>
  );
}
