import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi, questionsApi, examsApi } from '../../lib/api';
import { ArrowLeft, Plus, Search, Trash2, CheckCircle } from 'lucide-react';
import { Exam, Question } from '../../types';

export default function AdminExamBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  // Question Bank Search
  const [searchSubject, setSearchSubject] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [id]);

  const fetchExam = async () => {
    try {
      const res = await examsApi.get(id!);
      setExam(res.data);
      if (res.data.sections.length > 0 && !activeSectionId) {
        setActiveSectionId(res.data.sections[0].id);
        setSearchSubject(res.data.sections[0].subject);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchQuestions = async () => {
    setSearching(true);
    try {
      const res = await questionsApi.list({ subject: searchSubject });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (searchSubject) {
      searchQuestions();
    }
  }, [searchSubject]);

  const addQuestionToSection = async (questionId: string) => {
    if (!exam || !activeSectionId) return;
    try {
      await adminApi.addQuestion(exam.id, activeSectionId, { questionId });
      fetchExam(); // Refresh exam to show new question
    } catch (err) {
      alert('Failed to add question. It may already be in this section.');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Exam Builder...</div>;
  if (!exam) return <div className="p-12 text-center text-red-500">Exam not found.</div>;

  const activeSection = exam.sections.find(s => s.id === activeSectionId);
  const existingQuestionIds = new Set(activeSection?.questions?.map(eq => eq.questionId) || []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Exam Builder: {exam.title}</h1>
          <span className={`ml-auto px-2 py-1 text-xs font-semibold rounded-full ${exam.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {exam.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Exam Structure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-8rem)]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-2 overflow-x-auto">
            {exam.sections.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSectionId(section.id);
                  setSearchSubject(section.subject);
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeSectionId === section.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {section.name} ({section.questionCount})
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {!activeSection || activeSection.questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No questions added to {activeSection?.name || 'this section'} yet.</p>
                <p className="text-sm mt-2">Select questions from the bank on the right.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSection?.questions.map((eq, index) => (
                  <div key={eq.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-900">Q{index + 1}.</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                        {eq.question.questionType}
                      </span>
                    </div>
                    <div className="text-gray-800 text-sm line-clamp-3">
                      {eq.question.questionText}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Question Bank */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-8rem)]">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              Question Bank
            </h2>
            <div className="flex gap-2">
              <select 
                value={searchSubject}
                onChange={(e) => setSearchSubject(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              >
                <option value="PHYSICS">Physics</option>
                <option value="CHEMISTRY">Chemistry</option>
                <option value="MATHEMATICS">Mathematics</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {searching ? (
              <div className="text-center py-8 text-gray-500">Searching...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No questions found for this subject.</div>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => {
                  const isAdded = existingQuestionIds.has(q.id);
                  return (
                    <div key={q.id} className={`p-4 rounded-lg border ${isAdded ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{q.chapter}</span>
                          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">{q.difficulty}</span>
                        </div>
                        {isAdded ? (
                          <span className="flex items-center text-green-600 text-sm font-bold gap-1">
                            <CheckCircle className="w-4 h-4" /> Added
                          </span>
                        ) : (
                          <button
                            onClick={() => addQuestionToSection(q.id)}
                            className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded font-medium transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Add to Section
                          </button>
                        )}
                      </div>
                      <div className="text-gray-800 text-sm mb-3">
                        {q.questionText}
                      </div>
                      {q.questionType.startsWith('MCQ') && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {q.options?.map((opt: any) => (
                            <div key={opt.id} className={`text-xs p-2 border rounded ${opt.isCorrect ? 'bg-green-100 border-green-300 font-semibold' : 'bg-gray-50 border-gray-200'}`}>
                              {opt.optionLabel}. {opt.optionText}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
