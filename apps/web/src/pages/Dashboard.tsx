import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { analyticsApi, attemptsApi } from '../lib/api';
import { DashboardData, ExamAttempt } from '../types';
import { LogOut, BookOpen, Clock, Activity, Target, Award, List, Moon, Sun, TrendingUp, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, attemptsRes] = await Promise.all([
          analyticsApi.dashboard(),
          attemptsApi.list(),
        ]);
        setData(dashRes.data);
        setRecentAttempts(attemptsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 dark:text-gray-200">
      <div className="animate-pulse-slow flex flex-col items-center">
        <BookOpen className="w-12 h-12 text-blue-500 mb-4" />
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Loading Dashboard...</h2>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Top Nav */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-glow">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              JEE Mastery
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {user?.name}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-2"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
        
        {/* Action Bar */}
        <div className="mb-8 relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100 to-transparent dark:from-blue-900/20 rounded-bl-full -z-10 opacity-50 pointer-events-none"></div>
          
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center z-10">
            <div className="mb-6 sm:mb-0 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Ready to excel?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">Take a full mock test, practice chapter-wise, or review your past mistakes to boost your rank.</p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 w-full sm:w-auto">
              {user?.role === 'ADMIN' && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-800 text-white rounded-xl hover:bg-black dark:hover:bg-gray-700 font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Admin Panel
                </button>
              )}
              <button 
                onClick={() => navigate('/exams')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-glow hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Target className="w-5 h-5" />
                Start Practicing
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Avg Score" 
            value={`${data?.avgScore || 0}%`} 
            subtitle="Overall performance"
            icon={<Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />} 
            colorClass="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatCard 
            title="Avg Accuracy" 
            value={`${data?.avgAccuracy || 0}%`} 
            subtitle="Questions answered correctly"
            icon={<Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />} 
            colorClass="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <StatCard 
            title="Tests Attempted" 
            value={data?.totalAttempts || 0} 
            subtitle="Full & section tests"
            icon={<Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />} 
            colorClass="bg-purple-50 dark:bg-purple-900/20"
          />
          <StatCard 
            title="Questions Solved" 
            value={data?.totalQuestionsAttempted || 0} 
            subtitle="Total questions attempted"
            icon={<BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />} 
            colorClass="bg-amber-50 dark:bg-amber-900/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subject Performance */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6 flex flex-col transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subject Insights</h3>
            </div>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-emerald-500/10 dark:text-emerald-500/5">
                  <Target className="w-24 h-24" />
                </div>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold mb-1 relative z-10">Strongest Subject</p>
                <p className="text-2xl font-black text-emerald-900 dark:text-emerald-300 capitalize relative z-10">
                  {data?.strongestSubject?.toLowerCase() || 'N/A'}
                </p>
              </div>
              
              <div className="p-5 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800/50 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-rose-500/10 dark:text-rose-500/5">
                  <Activity className="w-24 h-24" />
                </div>
                <p className="text-sm text-rose-700 dark:text-rose-400 font-semibold mb-1 relative z-10">Needs Improvement</p>
                <p className="text-2xl font-black text-rose-900 dark:text-rose-300 capitalize relative z-10">
                  {data?.weakestSubject?.toLowerCase() || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-0 overflow-hidden transition-colors duration-300">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Recent Test History
              </h3>
              {recentAttempts.length > 5 && (
                <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
            
            {recentAttempts.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Clock className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No tests taken yet</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Your test history will appear here once you start practicing.</p>
                <button 
                  onClick={() => navigate('/exams')}
                  className="px-6 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Browse Tests
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-white dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Test Info</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {recentAttempts.slice(0, 5).map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{attempt.exam.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            {attempt.exam.examType.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {new Date(attempt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-md border
                            ${attempt.status === 'IN_PROGRESS' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'}`}>
                            {attempt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {attempt.status !== 'IN_PROGRESS' 
                            ? <span className="font-bold text-gray-900 dark:text-gray-200">{attempt.totalScore} <span className="text-gray-400 font-normal">/ {attempt.maxScore}</span></span>
                            : <span className="text-gray-300 dark:text-gray-600">-</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {attempt.status === 'IN_PROGRESS' ? (
                            <button onClick={() => navigate(`/exam/${attempt.id}`)} className="px-4 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg font-bold transition-colors">
                              Resume
                            </button>
                          ) : (
                            <button onClick={() => navigate(`/results/${attempt.id}`)} className="px-4 py-1.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-bold transition-colors">
                              Analysis
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, colorClass }: { title: string, value: string | number, subtitle: string, icon: React.ReactNode, colorClass: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-soft border border-gray-100 dark:border-gray-800 rounded-2xl group hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3.5 rounded-xl ${colorClass} transition-colors duration-300`}>
            {icon}
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{title}</dt>
              <dd className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</dd>
              <dd className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 truncate">{subtitle}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
