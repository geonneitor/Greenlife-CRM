import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * useAuthStore - Gestión centralizada de autenticación.
 * Sustituye el uso manual de localStorage en toda la app.
 * Utiliza persistencia automática bajo la clave '__greenlife_auth'.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      expiresAt: null, // timestamp de expiración local

      // Acciones
      setAuth: (authData) => {
        const { access_token, refresh_token, user, expires_in } = authData;
        
        // Calcular tiempo de expiración local (ahora + segundos)
        const expiresAt = expires_in ? Date.now() + (expires_in * 1000) : null;

        set({
          user,
          accessToken: access_token,
          refreshToken: refresh_token,
          isAuthenticated: true,
          expiresAt
        });
      },

      updateAccessToken: (newToken, expiresIn) => {
        const expiresAt = Date.now() + (expiresIn * 1000);
        set({ 
          accessToken: newToken,
          expiresAt
        });
      },

      logout: () => {
        // Limpiamos el estado pero no tocamos el resto de la app
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          expiresAt: null
        });
        
        // Opcional: Notificar a otros módulos del sistema
        window.dispatchEvent(new Event('greenlife-logout'));
      },

      // Helpers
      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        // Margen de seguridad de 30 segundos
        return Date.now() > (expiresAt - 30000);
      }
    }),
    {
      name: '__greenlife_auth', // Clave única en localStorage
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos lo estrictamente necesario
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        expiresAt: state.expiresAt
      })
    }
  )
);
