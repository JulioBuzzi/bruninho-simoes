import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('bs_token');
      localStorage.removeItem('bs_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ---- MATCHES ----
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

// ---- PLAYERS ----
export const playersApi = {
  getAll: (params) => api.get('/players', { params }).then(r => r.data),
  getById: (id, params) => api.get(`/players/${id}`, { params }).then(r => r.data),
  create: (data) => api.post('/players', data).then(r => r.data),
  update: (id, data) => api.put(`/players/${id}`, data).then(r => r.data),
};

// ---- TEAMS ----
export const teamsApi = {
  getAll: () => api.get('/teams').then(r => r.data),
  create: (data) => api.post('/teams', data).then(r => r.data),
  update: (id, data) => api.put(`/teams/${id}`, data).then(r => r.data),
};

// ---- RATINGS ----
export const ratingsApi = {
  save: (data) => api.post('/ratings', data).then(r => r.data),
  getStats: (params) => api.get('/ratings/stats', { params }).then(r => r.data),
  getPlayerHistory: (playerId, params) => api.get(`/ratings/player/${playerId}`, { params }).then(r => r.data),
};

// ---- AUTH ----
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

export default api;