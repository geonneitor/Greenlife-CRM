import { create } from 'zustand';

/**
 * useNotificationStore - Sistema centralizado de notificaciones (Toasts).
 * No es persistente (se limpia al refrescar la página).
 */
export const useNotificationStore = create((set) => ({
  notifications: [],

  /**
   * Agrega una notificación a la cola.
   * @param {string} message - Mensaje a mostrar
   * @param {'success'|'error'|'info'|'warning'} type - Tipo de notificación
   * @param {number} duration - Duración en ms (default 3000)
   */
  addNotification: (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id, message, type, duration }
      ]
    }));

    // Auto-eliminar después de la duración
    if (duration !== Infinity) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }));
      }, duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    }));
  },

  clearAll: () => set({ notifications: [] })
}));
