import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/auth';
import { useNotificationStore } from '../store/useNotificationStore';

/**
 * useAuth - Hook de conveniencia para interactuar con la autenticación.
 * Centraliza la lógica de login/logout para los componentes.
 */
export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    setAuth, 
    logout: clearStore 
  } = useAuthStore();
  
  const { addNotification } = useNotificationStore();

  const navigate = useNavigate();

  const login = useCallback(async (username, pin) => {
    try {
      const data = await authApi.loginWithPin(username, pin);
      
      setAuth({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
        expires_in: data.expires_in
      });
      
      addNotification(`¡Bienvenido, ${data.user.username}!`, 'success');
      navigate('/dashboard', { replace: true });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'PIN incorrecto o error de conexión';
      addNotification(message, 'error');
      return { success: false, error: message };
    }
  }, [setAuth, addNotification, navigate]);

  const logout = useCallback(() => {
    clearStore();
    addNotification('Sesión cerrada correctamente.', 'info');
  }, [clearStore, addNotification]);

  const updateUser = useCallback((updatedUserData) => {
    setAuth({
      access_token: useAuthStore.getState().accessToken,
      refresh_token: useAuthStore.getState().refreshToken,
      user: { ...user, ...updatedUserData },
      expires_in: (useAuthStore.getState().expiresAt - Date.now()) / 1000
    });
  }, [user, setAuth]);

  return {
    user,
    token: useAuthStore.getState().accessToken,
    isAuthenticated,
    login,
    logout,
    updateUser
  };
};
