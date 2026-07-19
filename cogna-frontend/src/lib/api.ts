import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get tokens from localStorage (Zustand state persistence)
const getPersistedAuth = () => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('cogna-auth');
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed.state || null;
  } catch {
    return null;
  }
};

// Request Interceptor: Attach bearer access token
api.interceptors.request.use(
  (config) => {
    const auth = getPersistedAuth();
    if (auth?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle automatic 401 JWT token refreshing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid loops or non-401 errors
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refreshing if we are calling refresh or login/register endpoint
    if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

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

    const auth = getPersistedAuth();
    if (!auth?.refreshToken) {
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: auth.refreshToken,
      });

      const { accessToken, refreshToken } = response.data.data;

      // Ensure Zustand is completely in sync to avoid the token rotation race condition
      if (typeof window !== 'undefined') {
        import('@/stores/auth').then(({ useAuthStore }) => {
          const store = useAuthStore.getState();
          if (store.user) {
            store.setAuth({
              user: store.user,
              accessToken,
              refreshToken,
            });
          }
        }).catch(console.error);
      }

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError, null);
      
      // Only log the user out if the refresh token was actually rejected (e.g., expired or invalid)
      const status = refreshError.response?.status;
      if (status === 401 || status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cogna-auth');
          window.location.href = '/login';
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
