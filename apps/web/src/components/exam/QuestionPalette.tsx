import { useState } from 'react';
import { useExamStore } from '../../store/examStore';
import { Subject } from '../../types';
import { Filter, X } from 'lucide-react';

type StatusFilter = 'NOT_VISITED' | 'NOT_ANSWERED' | 'ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED' | null;

const STATUS_CONFIG = [
  {
    key: 'NOT_VISITED' as const,
    label: 'Not Visited',
    btnClass: 'palette-btn-not-visited',
    legendBg: 'bg-gray-700 border-gray-600',
    textColor: 'text-gray-300',
  },
  {
    key: 'NOT_ANSWERED' as const,
    label: 'Not Answered',
    btnClass: 'palette-btn-not-answered',
    legendBg: 'bg-red-900/80 border-red-700',
    textColor: 'text-red-300',
  },
  {
    key: 'ANSWERED' as const,
    label: 'Answered',
    btnClass: 'palette-btn-answered',
    legendBg: 'bg-emerald-600 border-emerald-500',
    textColor: 'text-white',
  },
  {
    key: 'MARKED_FOR_REVIEW' as const,
    label: 'Marked for Review',
    btnClass: 'palette-btn-marked',
    legendBg: 'bg-violet-600 border-violet-500',
    textColor: 'text-white',
  },
  {
    key: 'ANSWERED_AND_MARKED' as const,
    label: 'Ans & Marked',
    btnClass: 'palette-btn-answered-marked',
    legendBg: 'border-emerald-500',
    textColor: 'text-white',
    gradient: true,
  },
];

export default function QuestionPalette() {
  const { exam, session, getSubjectStats, goToQuestion } = useExamStore();
  const [filterStatus, setFilterStatus] = useState<StatusFilter>(null);

  if (!exam || !session) return null;

  const currentSubject = session.currentSubject;
  const stats = getSubjectStats(currentSubject as Subject);
  const currentSection = exam.sections.find(s => s.subject === currentSubject);
  if (!currentSection) return null;

  let globalOffset = 0;
  for (const section of exam.sections) {
    if (section.subject === currentSubject) break;
    globalOffset += section.questions.length;
  }

  // Build flat list of questions with their global index
  const questionsWithIndex = currentSection.questions.map((eq, i) => ({
    eq,
    globalIndex: globalOffset + i,
    localIndex: i,
    status: session.answers[eq.questionId]?.status || 'NOT_VISITED',
  }));

  const handleLegendClick = (statusKey: StatusFilter) => {
    if (filterStatus === statusKey) {
      setFilterStatus(null);
      return;
    }
    setFilterStatus(statusKey);
    // Navigate to first question of that status
    const first = questionsWithIndex.find(q => q.status === statusKey);
    if (first) goToQuestion(first.globalIndex);
  };

  const getStatCount = (key: string) => {
    switch (key) {
      case 'NOT_VISITED':       return stats.notVisited;
      case 'NOT_ANSWERED':      return stats.notAnswered;
      case 'ANSWERED':          return stats.answered;
      case 'MARKED_FOR_REVIEW': return stats.markedReview;
      case 'ANSWERED_AND_MARKED': return stats.answeredMarked;
      default: return 0;
    }
  };

  const getButtonClass = (questionId: string, globalIndex: number) => {
    const isCurrent = session.currentQuestionIndex === globalIndex;
    const status = session.answers[questionId]?.status || 'NOT_VISITED';
    const config = STATUS_CONFIG.find(s => s.key === status);
    const base = `palette-btn ${config?.btnClass || 'palette-btn-not-visited'}`;
    const currentClass = isCurrent ? ' palette-btn-current' : '';
    const dimmed = filterStatus && status !== filterStatus ? ' palette-btn-dimmed' : '';
    return base + currentClass + dimmed;
  };

  return (
    <div className="w-80 bg-gray-900 flex flex-col border-l border-gray-700/80 shrink-0 overflow-hidden">
      {/* Section Header */}
      <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700/50 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">{currentSection.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Question Navigator</p>
          </div>
          {filterStatus && (
            <button
              onClick={() => setFilterStatus(null)}
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 bg-orange-900/20 hover:bg-orange-900/40 px-2 py-1 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Legend — each item is a clickable filter */}
      <div className="p-3 border-b border-gray-700/50 shrink-0 space-y-1.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Filter className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Filter by Status</span>
        </div>
        {STATUS_CONFIG.map(({ key, label, legendBg, textColor, gradient }) => {
          const count = getStatCount(key);
          const isActive = filterStatus === key;
          return (
            <button
              key={key}
              onClick={() => handleLegendClick(key as StatusFilter)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all text-left
                ${isActive ? 'ring-1 ring-orange-400 opacity-100' : 'opacity-80 hover:opacity-100'}
                ${gradient
                  ? `border-emerald-500 ${isActive ? '' : 'hover:ring-1 hover:ring-gray-500'}`
                  : `${legendBg} ${isActive ? '' : 'hover:ring-1 hover:ring-gray-500'}`
                }`}
              style={gradient ? { backgroundImage: 'linear-gradient(135deg, #7c3aed 50%, #059669 50%)' } : undefined}
            >
              <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
              <span className={`text-xs font-black ${textColor} bg-black/20 px-1.5 py-0.5 rounded-md`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Question Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-5 gap-2">
          {questionsWithIndex.map(({ eq, globalIndex, localIndex }) => (
            <button
              key={eq.questionId}
              className={getButtonClass(eq.questionId, globalIndex)}
              onClick={() => goToQuestion(globalIndex)}
              title={`Q${localIndex + 1}: ${(session.answers[eq.questionId]?.status || 'NOT_VISITED').replace(/_/g, ' ')}`}
            >
              {localIndex + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
