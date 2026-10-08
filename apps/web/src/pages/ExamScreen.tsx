import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamStore } from '../store/examStore';
import ExamHeader from '../components/exam/ExamHeader';
import SubjectTabs from '../components/exam/SubjectTabs';
import QuestionArea from '../components/exam/QuestionArea';
import QuestionPalette from '../components/exam/QuestionPalette';
import ExamFooter from '../components/exam/ExamFooter';
import SubmitModal from '../components/exam/SubmitModal';
import { BookOpen, Maximize2 } from 'lucide-react';

export default function ExamScreen() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { resumeExam, session, isLoading, error, isFullscreen, setIsFullscreen } = useExamStore();
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    async function init() {
      if (!attemptId) return;
      try {
        await resumeExam(attemptId);
      } catch (err) {
        console.error('Failed to resume:', err);
      } finally {
        setInitDone(true);
      }
    }
    init();
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [attemptId, resumeExam, setIsFullscreen]);

  useEffect(() => {
    if (session?.isSubmitted) {
      navigate(`/results/${session.attemptId}`);
    }
  }, [session?.isSubmitted, session?.attemptId, navigate]);

  if (isLoading || !initDone) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center animate-pulse">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-glow inline-block mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <p className="text-xl font-bold text-gray-300 mt-4">Loading Examination...</p>
          <p className="text-gray-500 text-sm mt-2">Preparing your question paper</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl text-red-400 font-bold mb-3">Error Loading Exam</h2>
          <p className="text-gray-400 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-950 select-none overflow-hidden">
      {/* Fullscreen Banner */}
      {!isFullscreen && (
        <div className="bg-amber-900/80 backdrop-blur-sm text-amber-200 px-4 py-1.5 text-center text-xs font-semibold flex justify-center items-center gap-2 border-b border-amber-800/50 shrink-0">
          <span>For the best exam experience, enable fullscreen.</span>
          <button 
            onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
            className="flex items-center gap-1 bg-amber-800/50 hover:bg-amber-700/50 px-2 py-0.5 rounded-md transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            Enable Fullscreen
          </button>
        </div>
      )}
      
      <ExamHeader />
      <SubjectTabs />
      
      <div className="flex flex-1 overflow-hidden relative">
        <QuestionArea />
        <QuestionPalette />
        <ExamFooter />
      </div>

      <SubmitModal />
    </div>
  );
}
