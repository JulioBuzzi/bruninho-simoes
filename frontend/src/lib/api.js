import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
});

const saveSession = (data) => {
  localStorage.setItem('bs_token', data.token);
  if (data.refreshToken) localStorage.setItem('bs_refresh_token', data.refreshToken);
  localStorage.setItem('bs_user', JSON.stringify(data.user));
};

const clearSession = () => {
  localStorage.removeItem('bs_token');
  localStorage.removeItem('bs_refresh_token');
  localStorage.removeItem('bs_user');
};

const refreshSession = async () => {
  const refreshToken = localStorage.getItem('bs_refresh_token');
  const accessToken = localStorage.getItem('bs_token');
  const headers = !refreshToken && accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
  const response = await axios.post(
    `${api.defaults.baseURL}/auth/refresh`,
    refreshToken ? { refreshToken } : {},
    { headers, timeout: api.defaults.timeout }
  );
  saveSession(response.data);
  return response.data;
};

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bs_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((request) => error ? request.reject(error) : request.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/auth/');

    if (
      error.response?.status !== 401 ||
      isAuthRequest ||
      originalRequest?._retry ||
      typeof window === 'undefined'
    ) {
      return Promise.reject(error);
    }

    const hasSession = localStorage.getItem('bs_token') || localStorage.getItem('bs_refresh_token');
    if (!hasSession) {
      window.location.href = '/admin/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const data = await refreshSession();
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      processQueue(null, data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
        clearSession();
        window.location.href = '/admin/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

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

export const playersApi = {
  getAll: (params) => api.get('/players', { params }).then(r => r.data),
  getById: (id, params) => api.get(`/players/${id}`, { params }).then(r => r.data),
  create: (data) => api.post('/players', data).then(r => r.data),
  update: (id, data) => api.put(`/players/${id}`, data).then(r => r.data),
};

export const teamsApi = {
  getAll: () => api.get('/teams').then(r => r.data),
  create: (data) => api.post('/teams', data).then(r => r.data),
  update: (id, data) => api.put(`/teams/${id}`, data).then(r => r.data),
};

export const ratingsApi = {
  save: (data) => api.post('/ratings', data).then(r => r.data),
  getStats: (params) => api.get('/ratings/stats', { params }).then(r => r.data),
  getPlayerHistory: (playerId, params) => api.get(`/ratings/player/${playerId}`, { params }).then(r => r.data),
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials).then((r) => {
    saveSession(r.data);
    return r.data;
  }),
  me: () => api.get('/auth/me').then(r => r.data),
  refresh: refreshSession,
  logout: async () => {
    const refreshToken = localStorage.getItem('bs_refresh_token');
    try {
      if (refreshToken) {
        await axios.post(
          `${api.defaults.baseURL}/auth/logout`,
          { refreshToken },
          { timeout: api.defaults.timeout }
        );
      }
    } finally {
      clearSession();
    }
  },
};

export default api;
