import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Access token is kept in memory only (refresh token lives in an httpOnly cookie).
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;

  // Double-submit CSRF token for state-changing requests.
  const method = (config.method || 'get').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = readCookie('csrfToken');
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  pendingQueue = [];
};

// Endpoints that should never trigger the refresh loop.
const skipRefresh = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/logout'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const original = config || {};

    const shouldRefresh =
      response?.status === 401 &&
      !original._retry &&
      !skipRefresh.some((path) => original.url?.includes(path));

    if (!shouldRefresh) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post('/auth/refresh');
      const newToken = data?.data?.accessToken;
      setAccessToken(newToken);
      flushQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      setAccessToken(null);
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
