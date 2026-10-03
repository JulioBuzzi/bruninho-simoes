import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
});

// ── Attach token to every request ──
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bs_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auto-refresh + redirect on 401 ──
let isRefreshing = false;
let failedQueue = []; // requests waiting for refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only try refresh on 401 and if we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      const token = localStorage.getItem('bs_token');

      // No token at all → go to login
      if (!token) {
        window.location.href = '/admin/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(newToken => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to get a fresh token
        const res = await api.post('/auth/refresh');
        const newToken = res.data.token;
        localStorage.setItem('bs_token', newToken);
        localStorage.setItem('bs_user', JSON.stringify(res.data.user));
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest); // retry original request
      } catch (refreshError) {
        // Refresh failed → token truly expired, force login
        processQueue(refreshError, null);
        localStorage.removeItem('bs_token');
        localStorage.removeItem('bs_user');
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── MATCHES ──
export const matchesApi = {
  getAll: (params) => api.get('/matches', { params }).then(r => r.data),
  getById: (id) => api.get(`/matches/${id}`).then(r => r.data),
  create: (data) => api.post('/matches', data).then(r => r.data),
  update: (id, data) => api.put(`/matches/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/matches/${id}`).then(r => r.data),
  updateGoalsAssists: (id, data) => api.put(`/matches/${id}/goals-assists`, data).then(r => r.data),
  getSeasons: () => api.get('/matches/seasons').then(r => r.data),
  getChampionships: () => api.get('/matches/championships').then(r => r.data),
};

// ── PLAYERS ──
export const playersApi = {
  getAll: (params) => api.get('/players', { params }).then(r => r.data),
  getById: (id, params) => api.get(`/players/${id}`, { params }).then(r => r.data),
  create: (data) => api.post('/players', data).then(r => r.data),
  update: (id, data) => api.put(`/players/${id}`, data).then(r => r.data),
};

// ── TEAMS ──
export const teamsApi = {
  getAll: () => api.get('/teams').then(r => r.data),
  create: (data) => api.post('/teams', data).then(r => r.data),
  update: (id, data) => api.put(`/teams/${id}`, data).then(r => r.data),
};

// ── RATINGS ──
export const ratingsApi = {
  save: (data) => api.post('/ratings', data).then(r => r.data),
  getStats: (params) => api.get('/ratings/stats', { params }).then(r => r.data),
  getPlayerHistory: (playerId, params) => api.get(`/ratings/player/${playerId}`, { params }).then(r => r.data),
};

// ── AUTH ──
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  refresh: () => api.post('/auth/refresh').then(r => r.data),
};

export default api;