import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Pages
import Dashboard from './pages/Dashboard';
import ExamScreen from './pages/ExamScreen';
import Login from './pages/Login';
import Results from './pages/Results';
import ExamList from './pages/ExamList';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminExamBuilder from './pages/admin/AdminExamBuilder';

// A simple PrivateRoute component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated && user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  const { loadUser } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/exams" element={<PrivateRoute><ExamList /></PrivateRoute>} />
        <Route path="/exam/:attemptId" element={<PrivateRoute><ExamScreen /></PrivateRoute>} />
        <Route path="/results/:attemptId" element={<PrivateRoute><Results /></PrivateRoute>} />
        
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/exams/:id/build" element={<AdminRoute><AdminExamBuilder /></AdminRoute>} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
