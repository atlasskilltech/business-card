import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getGoogleAuthUrl: () => api.get('/auth/google'),
  handleCallback: (code) => api.post('/auth/google/callback', { code }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

// Cards API
export const cardsAPI = {
  scanCard: (formData) => api.post('/cards/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getCards: (params) => api.get('/cards', { params }),
  getCard: (id) => api.get(`/cards/${id}`),
  updateCard: (id, data) => api.put(`/cards/${id}`, data),
  deleteCard: (id) => api.delete(`/cards/${id}`),
  syncCard: (id) => api.post(`/cards/${id}/sync`),
  batchSync: (cardIds) => api.post('/cards/batch-sync', { cardIds }),
  getStats: () => api.get('/cards/dashboard/stats')
};

// Email API
export const emailAPI = {
  getDrafts: () => api.get('/email/drafts'),
  getDraftContent: (draftId) => api.get(`/email/drafts/${draftId}`),
  createCampaign: (data) => api.post('/email/campaigns', data),
  getCampaigns: () => api.get('/email/campaigns'),
  getCampaign: (id) => api.get(`/email/campaigns/${id}`),
  getSentEmails: (params) => api.get('/email/sent', { params }),
  getStats: () => api.get('/email/stats')
};

export default api;