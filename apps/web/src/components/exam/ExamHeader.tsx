import { useEffect, useState } from 'react';
import { useExamStore } from '../../store/examStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { BookOpen, Sun, Moon, AlertCircle } from 'lucide-react';

export default function ExamHeader() {
  const { exam, session, getTimeRemaining, submitExam } = useExamStore();
  const { user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());

  useEffect(() => {
    if (!session) return;
    setTimeLeft(getTimeRemaining());
    const timer = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        submitExam(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [session, getTimeRemaining, submitExam]);

  const hours   = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const timeString = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;

  let timerColorClass = 'timer-normal';
  if (timeLeft < 300)       timerColorClass = 'timer-critical';
  else if (timeLeft < 600)  timerColorClass = 'timer-danger';
  else if (timeLeft < 1800) timerColorClass = 'timer-warning';

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';

  return (
    <header className="bg-gray-900 border-b border-gray-700/80 shrink-0 shadow-lg">
      <div className="flex items-center justify-between px-5 py-3 gap-4">
        {/* Left: Brand + Exam Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-glow shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 uppercase">
              JEE Mastery
            </h1>
            <h2 className="text-xs font-semibold text-gray-400 truncate max-w-[240px]">
              {exam?.title || 'Mock Test'}
            </h2>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">
            Time Remaining
          </span>
          <div className={`font-mono text-2xl font-black tracking-widest ${timerColorClass} flex items-center gap-1.5`}>
            {timeLeft < 600 && <AlertCircle className="w-4 h-4 animate-pulse" />}
            {timeString}
          </div>
        </div>

        {/* Right: Theme + Candidate */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-amber-400 rounded-lg hover:bg-gray-800 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Candidate</p>
              <p className="text-sm font-bold text-gray-200">{user?.name || 'Student'}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md border border-indigo-400/30">
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
