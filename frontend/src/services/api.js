import axios from 'axios';

let rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
if (rawApiUrl && !rawApiUrl.endsWith('/api')) {
  rawApiUrl = rawApiUrl.replace(/\/+$/, '') + '/api';
}
const API_BASE_URL = rawApiUrl || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let accessTokenInMemory = localStorage.getItem('atomic_ops_token') || null;
let refreshTokenInMemory = localStorage.getItem('atomic_ops_refresh_token') || null;

export const setAccessToken = (token) => {
  accessTokenInMemory = token;
  if (token) {
    localStorage.setItem('atomic_ops_token', token);
  } else {
    localStorage.removeItem('atomic_ops_token');
  }
};

export const getAccessToken = () => {
  return accessTokenInMemory || localStorage.getItem('atomic_ops_token');
};

export const setRefreshToken = (token) => {
  refreshTokenInMemory = token;
  if (token) {
    localStorage.setItem('atomic_ops_refresh_token', token);
  } else {
    localStorage.removeItem('atomic_ops_refresh_token');
  }
};

export const getRefreshToken = () => {
  return refreshTokenInMemory || localStorage.getItem('atomic_ops_refresh_token');
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = getRefreshToken();
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );
        const newAccessToken = data.token;
        setAccessToken(newAccessToken);
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
        }
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('atomic_ops_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
