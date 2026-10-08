import { useExamStore } from '../../store/examStore';
import { Subject } from '../../types';

const SUBJECT_COLORS: Record<string, string> = {
  PHYSICS:     'from-blue-500 to-cyan-500',
  CHEMISTRY:   'from-emerald-500 to-teal-500',
  MATHEMATICS: 'from-orange-500 to-amber-500',
};

export default function SubjectTabs() {
  const { exam, session, goToSubject, getSubjectStats } = useExamStore();
  if (!exam || !session) return null;

  return (
    <div className="flex bg-gray-800 border-b border-gray-700 shrink-0 overflow-x-auto">
      {exam.sections.map((section) => {
        const isCurrent = session.currentSubject === section.subject;
        const stats = getSubjectStats(section.subject as Subject);
        const gradient = SUBJECT_COLORS[section.subject] || 'from-gray-500 to-gray-400';

        return (
          <button
            key={section.id}
            onClick={() => goToSubject(section.subject as Subject)}
            className={`relative px-6 py-3 text-sm font-bold tracking-wide transition-all whitespace-nowrap flex items-center gap-2 border-b-2
              ${isCurrent
                ? 'text-white border-orange-400 bg-gray-900'
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-700/50'
              }`}
          >
            {isCurrent && (
              <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${gradient} shrink-0`} />
            )}
            <span>{section.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ml-1
              ${isCurrent
                ? 'bg-orange-400/20 text-orange-300'
                : 'bg-gray-700 text-gray-500'
              }`}>
              {stats.answered}/{section.questionCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
