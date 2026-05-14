import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * useUIStore - Gestión de la interfaz y preferencias de usuario.
 * Independiente de la sesión de autenticación.
 */
export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'greenlife',
      font: 'quicksand',
      fontWeight: 500,
      letterSpacing: 0,
      activeVendedor: 'Geonneitor',

      // Acciones
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebar: (isOpen) => set({ sidebarOpen: isOpen }),
      setTheme: (newTheme) => set({ theme: newTheme }),
      setFont: (newFont) => set({ font: newFont }),
      setFontWeight: (newWeight) => set({ fontWeight: newWeight }),
      setLetterSpacing: (newSpacing) => set({ letterSpacing: newSpacing }),
      setActiveVendedor: (name) => set({ activeVendedor: name }),

      resetUI: () => set({
        sidebarOpen: true,
        theme: 'greenlife',
        font: 'quicksand',
        fontWeight: 500,
        letterSpacing: 0,
      })

    }),
    {
      name: '__greenlife_ui',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
