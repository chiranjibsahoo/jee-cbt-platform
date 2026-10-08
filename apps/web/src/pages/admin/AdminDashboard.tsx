import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/api';
import { ArrowLeft, Plus, Settings, Users, BookOpen, Trash2 } from 'lucide-react';
import { Exam } from '../../types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exams');

  // Create Exam Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    examType: 'JEE_MAIN',
    duration: 180,
    isPublished: true,
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await adminApi.getExams();
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // By default, create 3 sections for JEE
      const sections = [
        { name: 'Physics', subject: 'PHYSICS', questionCount: 0 },
        { name: 'Chemistry', subject: 'CHEMISTRY', questionCount: 0 },
        { name: 'Mathematics', subject: 'MATHEMATICS', questionCount: 0 },
      ];

      await adminApi.createExam({
        ...newExam,
        mode: 'FULL_TEST',
        sections
      });
      setShowCreateModal(false);
      setNewExam({ title: '', description: '', examType: 'JEE_MAIN', duration: 180, isPublished: true });
      fetchExams();
    } catch (err) {
      console.error('Failed to create exam');
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam? All attempts and answers will be deleted.')) return;
    try {
      await adminApi.deleteExam(id);
      fetchExams();
    } catch (err) {
      console.error('Failed to delete exam');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Admin Control Panel
            </h1>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('exams')}
              className={`px-3 py-2 rounded ${activeTab === 'exams' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Exams
            </button>
            <button 
              onClick={() => setActiveTab('import')}
              className={`px-3 py-2 rounded ${activeTab === 'import' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Bulk Import
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-3 py-2 rounded ${activeTab === 'users' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Users
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'exams' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Test Management</h2>
                <p className="text-sm text-gray-500">Create and configure examinations.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Create New Test
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading exams...</div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{exam.title}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <BookOpen className="w-3 h-3" />
                            {exam.sections.map(s => s.name).join(', ')} ({exam.sections.reduce((acc, s) => acc + s.questionCount, 0)} Qs)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exam.examType.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exam.duration} mins
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${exam.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {exam.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/admin/exams/${exam.id}/build`)} 
                            className="text-blue-600 hover:text-blue-900 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded text-xs font-bold"
                          >
                            Build Test
                          </button>
                          <button onClick={() => handleDeleteExam(exam.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <BulkImport />
        )}

        {activeTab === 'users' && (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700">User Management</h2>
            <p className="text-gray-500 mt-2">View and manage registered students. (Available in full version)</p>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Create New Test</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Title</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newExam.title}
                  onChange={e => setNewExam({...newExam, title: e.target.value})}
                  placeholder="e.g. Weekly Mock Test 05"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newExam.description}
                  onChange={e => setNewExam({...newExam, description: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={newExam.examType}
                    onChange={e => setNewExam({...newExam, examType: e.target.value})}
                  >
                    <option value="JEE_MAIN">JEE Main</option>
                    <option value="JEE_ADVANCED">JEE Advanced</option>
                    <option value="CUSTOM">Custom Practice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={newExam.duration}
                    onChange={e => setNewExam({...newExam, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  id="published"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={newExam.isPublished}
                  onChange={e => setNewExam({...newExam, isPublished: e.target.checked})}
                />
                <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
                  Publish immediately
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


function BulkImport() {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    try {
      setLoading(true);
      const parsed = JSON.parse(jsonInput);
      const questions = Array.isArray(parsed) ? parsed : [parsed];
      
      // We need to use the adminApi which is already imported at the top of the file
      const res = await adminApi.importQuestions(questions);
      setResult({ success: true, message: `Successfully imported ${res.data.created} questions.` });
      setJsonInput('');
    } catch (err: any) {
      setResult({ success: false, message: 'Invalid JSON or import failed. ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const sampleJson = `[
  {
    "subject": "PHYSICS",
    "chapter": "Kinematics",
    "topic": "Projectile Motion",
    "questionType": "MCQ_SINGLE",
    "questionText": "A projectile is launched with velocity v at angle θ. What is the maximum height?",
    "difficulty": "MEDIUM",
    "marks": 4,
    "negativeMarks": -1,
    "options": [
      { "label": "A", "text": "(v²sin²θ)/2g", "isCorrect": true },
      { "label": "B", "text": "(v²sin2θ)/g", "isCorrect": false },
      { "label": "C", "text": "(v sinθ)/g", "isCorrect": false },
      { "label": "D", "text": "(v²cos²θ)/2g", "isCorrect": false }
    ],
    "solution": "Maximum height is given by H = (v²sin²θ)/2g"
  }
]`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Import Questions</h2>
      <p className="text-gray-500 mb-4">Paste a JSON array of questions to add them directly to the Question Bank.</p>
      
      {result && (
        <div className={`p-4 mb-4 rounded-lg ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">JSON Input</label>
          <textarea
            className="w-full h-96 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON array here..."
          />
          <button
            onClick={handleImport}
            disabled={loading || !jsonInput.trim()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Importing...' : 'Import Questions'}
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Sample Format</h3>
          <pre className="text-xs text-gray-600 overflow-x-auto">
            {sampleJson}
          </pre>
          <div className="mt-4 text-xs text-gray-500">
            <p className="font-bold mb-1">Required Fields:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>subject (PHYSICS, CHEMISTRY, MATHEMATICS)</li>
              <li>chapter (String)</li>
              <li>questionType (MCQ_SINGLE, MCQ_MULTIPLE, NUMERICAL)</li>
              <li>questionText (String, supports KaTeX)</li>
              <li>options (Array of objects with label, text, isCorrect)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
