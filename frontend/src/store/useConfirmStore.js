import { create } from 'zustand';

export const useConfirmStore = create((set) => ({
  isOpen: false,
  message: '',
  description: '',
  onConfirm: null,
  onCancel: null,

  /**
   * Muestra el modal de confirmación
   * @param {Object} options
   * @param {string} options.title - Título principal (ej: "¿Estás seguro?")
   * @param {string} options.description - Descripción detallada
   * @param {Function} options.onConfirm - Callback al confirmar
   */
  ask: ({ title, description, onConfirm }) => {
    set({
      isOpen: true,
      message: title,
      description: description || 'Esta acción no se puede deshacer.',
      onConfirm: async () => {
        if (onConfirm) await onConfirm();
        set({ isOpen: false });
      },
      onCancel: () => set({ isOpen: false })
    });
  },

  close: () => set({ isOpen: false })
}));
