import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage (Zustand persist stores it there)
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            try {
                const { state } = JSON.parse(authStorage);
                if (state?.token) {
                    config.headers.Authorization = `Bearer ${state.token}`;
                }
            } catch (error) {
                console.error('Failed to parse auth storage:', error);
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't auto-redirect on 401 - let components handle it
        // This prevents flickering during auth state changes
        return Promise.reject(error);
    }
);

export default api;

// API Services
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (data: any) => api.post('/auth/register', data),
    googleSignIn: (data: { idToken?: string; email: string; name: string; photoURL?: string }) =>
        api.post('/auth/google', data),
    getMe: () => api.get('/auth/me'),
};

export const expenseAPI = {
    getAll: (params?: any) => api.get('/expenses', { params }),
    getById: (id: string) => api.get(`/expenses/${id}`),
    create: (data: FormData) =>
        api.post('/expenses', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
    delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const approvalAPI = {
    getPending: () => api.get('/approvals/pending'),
    makeDecision: (id: string, status: string, comments?: string) =>
        api.post(`/approvals/${id}/decision`, { status, comments }),
};

export const categoryAPI = {
    getAll: () => api.get('/categories'),
};

export const departmentAPI = {
    getAll: () => api.get('/departments'),
};

export const budgetAPI = {
    getAll: () => api.get('/budgets'),
};

export const notificationAPI = {
    getAll: () => api.get('/notifications'),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const statsAPI = {
    getDashboard: () => api.get('/stats/dashboard'),
};

export const userAPI = {
    getAll: () => api.get('/users'),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data: any) => api.put('/users/profile', data),
    getPreferences: () => api.get('/users/preferences'),
    updatePreferences: (data: any) => api.put('/users/preferences', data),
};
