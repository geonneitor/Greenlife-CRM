/**
 * SMOKE RINGS — Design Tokens
 * Todos los colores referencian CSS variables establecidas por App.jsx al cargar el tema.
 * Esto garantiza que cambiar el tema en Settings se refleja en TODA la app.
 */

export const colors = {
  brand:     'var(--brand, #00D084)',
  brandDark: 'var(--brand-dark, #00A366)',
  danger:    '#D4685A',

  surface: {
    base:    'var(--bg-main, #061109)',
    elevated: 'var(--bg-card, #0A1A0F)',
    hover:   'rgba(var(--brand-rgb, 0,208,132), 0.05)',
  },

  border: {
    subtle:  'var(--border-glass, rgba(255,255,255,0.07))',
    default: 'rgba(255, 255, 255, 0.12)',
  },

  text: {
    primary:   'var(--text-main, #F1F5F1)',
    secondary:  'var(--text-muted, #6B8C72)',
    muted:     'var(--text-muted, #6B8C72)',
    inverse:   'var(--bg-main, #061109)',
  },

  status: {
    success: '#10B981',
    warning: '#D4A050',
    error:   '#D4685A',
    info:    '#BFA98C',
  },
}

export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '24px',
  xxl: '32px',
}

export const radius = {
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  full: '9999px',
}

export const shadows = {
  sm:        '0 1px 3px rgba(0,0,0,0.3)',
  md:        '0 4px 6px rgba(0,0,0,0.4)',
  lg:        '0 10px 15px rgba(0,0,0,0.5)',
  xl:        '0 20px 25px rgba(0,0,0,0.6)',
  brandGlow: '0 0 24px rgba(var(--brand-rgb, 0,208,132), 0.18)',
}

export const zIndex = {
  base:    1,
  overlay: 100,
  modal:   200,
  toast:   300,
}

export const animation = {
  fast:   '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow:   '400ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
}