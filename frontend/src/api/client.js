import axios from 'axios';
import axiosRetry from 'axios-retry';
import nProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';

// Configuración de NProgress
nProgress.configure({ showSpinner: false, trickleSpeed: 200 });

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Cliente Axios pre-configurado con:
 * 1. Base URL automática
 * 2. Reintentos automáticos (axios-retry)
 * 3. Interceptores de Auth (Zustand)
 * 4. Interceptores de UX (NProgress)
 * 5. Manejo de Refresh Token automático
 */
const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Configuración de Reintentos (axios-retry)
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Reintentar solo en errores de red o errores 5xx (servidor caído temporalmente)
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response?.status >= 500);
  },
});

// 2. Interceptor de Petición (Request)
client.interceptors.request.use(
  (config) => {
    nProgress.start();
    
    // Obtener token del store de Zustand
    const { accessToken } = useAuthStore.getState();
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    nProgress.done();
    return Promise.reject(error);
  }
);

// 3. Interceptor de Respuesta (Response)
client.interceptors.response.use(
  (response) => {
    nProgress.done();
    return response;
  },
  async (error) => {
    nProgress.done();
    
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      const { addNotification } = useNotificationStore.getState();
      addNotification('Tu sesión ha finalizado. Por favor ingresa de nuevo.', 'warning');
      logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (!error.response) {
      const { addNotification } = useNotificationStore.getState();
      addNotification('Error de conexión. Verifica tu internet.', 'error');
    } else if (error.response.status >= 500) {
      const { addNotification } = useNotificationStore.getState();
      addNotification('Error en el servidor. Reintentando...', 'warning');
    }

    return Promise.reject(error);
  }
);

export default client;
