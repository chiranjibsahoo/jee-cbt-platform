import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examsApi, attemptsApi } from '../lib/api';
import { Exam } from '../types';
import { ArrowLeft, Clock, BookOpen, Target, CheckCircle, ChevronRight, Play } from 'lucide-react';

export default function ExamList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await examsApi.list();
        setExams(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, []);

  const handleStartExam = async (examId: string) => {
    if (!confirm('Are you ready to start this exam? The timer will begin immediately.')) return;
    try {
      const res = await attemptsApi.start(examId);
      // API returns { attempt: {...}, timeRemaining, resumed } or { attempt, ... }
      const attempt = res.data.attempt;
      if (!attempt?.id) throw new Error('Invalid response from server');
      navigate(`/exam/${attempt.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to start exam');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 dark:text-gray-200">
      <div className="animate-pulse-slow flex flex-col items-center">
        <Target className="w-12 h-12 text-blue-500 mb-4" />
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Loading Tests...</h2>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Available Practice Tests</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
        {exams.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-800">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No exams available</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Check back later for new practice tests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 uppercase tracking-wider">
                      {exam.examType.replace('_', ' ')}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-sm font-semibold">
                      {exam.year || 'Practice'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{exam.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 line-clamp-3">
                    {exam.description || 'Full syllabus mock test based on the latest NTA pattern.'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <span className="text-sm font-bold">{exam.duration} mins</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <Target className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-sm font-bold">{exam.totalMarks} marks</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartExam(exam.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 dark:bg-gray-800 text-white rounded-xl hover:bg-black dark:hover:bg-gray-700 font-bold transition-colors group-hover:bg-blue-600 dark:group-hover:bg-blue-600"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Exam
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
