import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptsApi } from '../lib/api';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle, AlertCircle, Clock, Target, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Results() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await attemptsApi.result(attemptId!);
        setResult(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;
  if (!result) return <div className="min-h-screen flex items-center justify-center">Result not found.</div>;

  const totalQuestions = result.correctCount + result.incorrectCount + result.unansweredCount;
  const accuracy = (result.correctCount + result.incorrectCount) > 0 
    ? Math.round((result.correctCount / (result.correctCount + result.incorrectCount)) * 100) 
    : 0;

  const pieData = [
    { name: 'Correct', value: result.correctCount, color: '#10b981' },
    { name: 'Incorrect', value: result.incorrectCount, color: '#ef4444' },
    { name: 'Unanswered', value: result.unansweredCount, color: '#9ca3af' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="mr-4 text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Exam Results</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Main Score Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-blue-800 text-white p-8 flex flex-col md:flex-row items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider mb-2">Final Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black">{result.totalScore}</span>
                <span className="text-xl text-blue-200">/ {result.maxScore}</span>
              </div>
              <h2 className="text-xl mt-4 text-white opacity-90 font-medium">{result.exam.title}</h2>
            </div>
            
            <div className="mt-6 md:mt-0 flex gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{accuracy}%</div>
                <div className="text-blue-200 text-sm uppercase tracking-wider mt-1">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.floor(result.timeUsed / 60)}m {result.timeUsed % 60}s</div>
                <div className="text-blue-200 text-sm uppercase tracking-wider mt-1">Time Used</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('summary')}
              className={`${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`${activeTab === 'review' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Question Review
            </button>
          </nav>
        </div>

        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{result.correctCount}</div>
                <div className="text-sm text-gray-500">Correct</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{result.incorrectCount}</div>
                <div className="text-sm text-gray-500">Incorrect</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col items-center justify-center">
                <MinusCircle className="w-8 h-8 text-gray-400 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{result.unansweredCount}</div>
                <div className="text-sm text-gray-500">Unanswered</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col items-center justify-center">
                <Target className="w-8 h-8 text-blue-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{totalQuestions}</div>
                <div className="text-sm text-gray-500">Total Questions</div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Attempt Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-6">
            {result.answers.map((ans: any, idx: number) => {
              const q = ans.question;
              const isCorrect = ans.isCorrect;
              const isUnanswered = ans.isCorrect === null;
              
              return (
                <div key={ans.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className={`p-4 border-b flex justify-between items-center ${
                    isCorrect ? 'bg-green-50 border-green-200' : 
                    isUnanswered ? 'bg-gray-50 border-gray-200' : 
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg">Q{idx + 1}</span>
                      <span className="text-sm font-medium px-2 py-1 bg-white rounded shadow-sm">
                        {ans.subject}
                      </span>
                      <span className="text-sm font-medium px-2 py-1 bg-white rounded shadow-sm">
                        {q.chapter}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">Time: {ans.timeSpent}s</span>
                      <div className={`font-bold px-3 py-1 rounded ${
                        isCorrect ? 'text-green-700 bg-green-100' : 
                        isUnanswered ? 'text-gray-700 bg-gray-200' : 
                        'text-red-700 bg-red-100'
                      }`}>
                        Marks: {ans.marksAwarded}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="text-lg font-medium text-gray-900 mb-6">{q.questionText}</div>
                    
                    {q.questionType.startsWith('MCQ') && (
                      <div className="space-y-3 mb-6">
                        {q.options.map((opt: any) => {
                          const isStudentSelected = ans.selectedOptions?.includes(opt.optionLabel);
                          const isOptionCorrect = opt.isCorrect;
                          
                          let bg = 'bg-gray-50 border-gray-200';
                          if (isOptionCorrect) bg = 'bg-green-50 border-green-300 ring-1 ring-green-300';
                          else if (isStudentSelected && !isOptionCorrect) bg = 'bg-red-50 border-red-300';
                          
                          return (
                            <div key={opt.id} className={`p-3 rounded border flex items-center gap-3 ${bg}`}>
                              <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                                isOptionCorrect ? 'bg-green-500 text-white' :
                                isStudentSelected ? 'bg-red-500 text-white' :
                                'bg-white border-2 border-gray-300 text-gray-500'
                              }`}>
                                {opt.optionLabel}
                              </span>
                              <span>{opt.optionText}</span>
                              {isOptionCorrect && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                              {isStudentSelected && !isOptionCorrect && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {q.questionType === 'NUMERICAL' && (
                      <div className="flex gap-8 mb-6">
                        <div>
                          <span className="text-sm text-gray-500">Your Answer:</span>
                          <div className={`text-lg font-bold mt-1 ${isCorrect ? 'text-green-600' : isUnanswered ? 'text-gray-500' : 'text-red-600'}`}>
                            {ans.numericalAnswer ?? 'Not Attempted'}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Correct Answer:</span>
                          <div className="text-lg font-bold mt-1 text-green-600">
                            {q.options.find((o:any) => o.isCorrect)?.optionText}
                          </div>
                        </div>
                      </div>
                    )}

                    {q.solution && (
                      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-5">
                        <h4 className="font-bold text-blue-900 mb-2">Solution & Explanation</h4>
                        <p className="text-gray-800 whitespace-pre-line">{q.solution}</p>
                        {q.explanation && <p className="text-gray-700 mt-2 text-sm italic">{q.explanation}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
