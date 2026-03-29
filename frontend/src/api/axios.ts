import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adiciona o access token em toda request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Controle para evitar loop infinito de refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];
let isSyncingUser = false;

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

// Interceptor de resposta: renova o token automaticamente em caso de 401
// e sincroniza dados do usuário em caso de 403 (ex: casalId desatualizado após remoção remota)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignora 401 na própria rota de refresh para evitar loop
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
          { refreshToken }
        );

        const { token, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 403: dados do usuário desatualizados (ex: parceiro removido remotamente)
    // Busca dados frescos do backend e recarrega a página uma única vez
    if (
      error.response?.status === 403 &&
      !isSyncingUser &&
      !originalRequest.url?.includes('/usuarios/me') &&
      !originalRequest.url?.includes('/auth/')
    ) {
      isSyncingUser = true;
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const meResponse = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/usuarios/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...currentUser, ...meResponse.data }));
          window.location.reload();
        } else {
          localStorage.clear();
          window.location.href = '/login';
        }
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
