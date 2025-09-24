import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await authService.refreshAuthToken();
        if (token && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Handle refresh token failure
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.response.data);
    } else if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }

    return Promise.reject(error);
  }
);

// Admin APIs
export const adminApi = {
  getAll: () => api.get('/admin'),
  getById: (id: string) => api.get(`/admin/${id}`),
  create: (data: any) => api.post('/admin', data),
  update: (id: string, data: any) => api.put(`/admin/${id}`, data),
  delete: (id: string) => api.delete(`/admin/${id}`)
};

// Faculty APIs
export const facultyApi = {
  getAll: () => api.get('/faculty'),
  getById: (id: string) => api.get(`/faculty/${id}`),
  create: (data: any) => api.post('/faculty', data),
  update: (id: string, data: any) => api.put(`/faculty/${id}`, data),
  delete: (id: string) => api.delete(`/faculty/${id}`)
};

// Student APIs
export const studentApi = {
  getAll: () => api.get('/students'),
  getByDepartment: (deptId: string) => api.get(`/students/department/${deptId}`),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  bulkImport: (data: any[]) => api.post('/students/bulk-import', { students: data })
};

// Department APIs
export const departmentApi = {
  getAll: () => api.get('/departments'),
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (data: any) => api.post('/departments', data),
  update: (id: string, data: any) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
  getStatistics: (id: string) => api.get(`/departments/${id}/statistics`)
};

// Subject APIs
export const subjectApi = {
  getAll: () => api.get('/subjects'),
  getByDepartment: (deptId: string) => api.get(`/subjects/department/${deptId}`),
  getById: (id: string) => api.get(`/subjects/${id}`),
  create: (data: any) => api.post('/subjects', data),
  update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
  bulkImport: (data: any[]) => api.post('/subjects/bulk-import', { subjects: data })
};

// Classroom APIs
export const classroomApi = {
  getAll: () => api.get('/classrooms'),
  getById: (id: string) => api.get(`/classrooms/${id}`),
  create: (data: any) => api.post('/classrooms', data),
  update: (id: string, data: any) => api.put(`/classrooms/${id}`, data),
  delete: (id: string) => api.delete(`/classrooms/${id}`),
  getAvailability: (id: string, date: string) => api.get(`/classrooms/${id}/availability?date=${date}`),
  bulkImport: (data: any[]) => api.post('/classrooms/bulk-import', { classrooms: data })
};

// Schedule APIs
export const scheduleApi = {
  getAll: () => api.get('/schedule'),
  getById: (id: string) => api.get(`/schedule/${id}`),
  generateSchedule: (data: any) => api.post('/schedule/generate', data),
  modifySchedule: (id: string, data: any) => api.post(`/schedule/${id}/modify`, data),
  updateStatus: (id: string, status: 'draft' | 'published') => 
    api.patch(`/schedule/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/schedule/${id}`)
};

// AI Schedule Modifier APIs
export const aiApi = {
  modifySchedule: (message: string, file?: File) => {
    const formData = new FormData();
    formData.append('message', message);
    if (file) {
      formData.append('file', file);
    }
    return api.post('/ai-schedule-modify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  applyModifications: (modifications: any[]) => 
    api.post('/apply-modifications', { modifications }),
  undoModification: (modification: any) => 
    api.post('/undo-modification', { modification })
};

export const apiService = api;
export default api;
