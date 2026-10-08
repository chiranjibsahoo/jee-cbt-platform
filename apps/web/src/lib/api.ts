import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jee_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jee_token');
      localStorage.removeItem('jee_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/auth/profile', data),
};

// Exams
export const examsApi = {
  list: (params?: { examType?: string; mode?: string }) =>
    api.get('/exams', { params }),
  get: (id: string) => api.get(`/exams/${id}`),
};

// Questions
export const questionsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get('/questions', { params }),
  get: (id: string) => api.get(`/questions/${id}`),
};

// Attempts
export const attemptsApi = {
  start: (examId: string) => api.post('/attempts/start', { examId }),
  get: (id: string) => api.get(`/attempts/${id}`),
  list: () => api.get('/attempts'),
  saveAnswer: (attemptId: string, data: {
    questionId: string;
    selectedOptions?: string[];
    numericalAnswer?: number;
    status: string;
    timeSpent: number;
    currentQuestion?: number;
    currentSubject?: string;
  }) => api.post(`/attempts/${attemptId}/answer`, data),
  sync: (attemptId: string, data: {
    answers: Array<{
      questionId: string;
      questionIndex: number;
      subject: string;
      status: string;
      selectedOptions?: string[];
      numericalAnswer?: number;
      timeSpent: number;
    }>;
    currentQuestion: number;
    currentSubject: string;
  }) => api.post(`/attempts/${attemptId}/sync`, data),
  submit: (attemptId: string, autoSubmit?: boolean) =>
    api.post(`/attempts/${attemptId}/submit`, { autoSubmit }),
  result: (attemptId: string) => api.get(`/attempts/${attemptId}/result`),
};

// Analytics
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  chapters: (subject?: string) => api.get('/analytics/chapters', { params: { subject } }),
};

// Bookmarks
export const bookmarksApi = {
  list: () => api.get('/bookmarks'),
  toggle: (questionId: string, note?: string) =>
    api.post('/bookmarks/toggle', { questionId, note }),
  delete: (questionId: string) => api.delete(`/bookmarks/${questionId}`),
};

// Mistakes
export const mistakesApi = {
  list: (params?: { subject?: string; mistakeType?: string; isResolved?: boolean }) =>
    api.get('/mistakes', { params }),
  add: (data: { questionId: string; attemptId?: string; mistakeType: string; note?: string }) =>
    api.post('/mistakes', data),
  update: (id: string, data: { note?: string; isResolved?: boolean }) =>
    api.put(`/mistakes/${id}`, data),
  delete: (id: string) => api.delete(`/mistakes/${id}`),
};

// Admin
export const adminApi = {
  getExams: () => api.get('/admin/exams'),
  createExam: (data: any) => api.post('/admin/exams', data),
  updateExam: (id: string, data: any) => api.put(`/admin/exams/${id}`, data),
  deleteExam: (id: string) => api.delete(`/admin/exams/${id}`),
  addQuestion: (examId: string, sectionId: string, data: any) =>
    api.post(`/admin/exams/${examId}/sections/${sectionId}/questions`, data),
  createQuestion: (data: any) => api.post('/admin/questions', data),
  updateQuestion: (id: string, data: any) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/admin/questions/${id}`),
  importQuestions: (questions: any[]) => api.post('/admin/questions/import', { questions }),
  getUsers: () => api.get('/admin/users'),
};
