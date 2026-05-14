/**
 * SMOKE RINGS — Sistema de Temas
 *
 * Cada tema define un conjunto coherente de variables visuales.
 * Criterios de diseño:
 *  - bg/card: superficies oscuras que soporten texto claro
 *  - brand: color de acento con suficiente saturación en fondo oscuro (WCAG AA ~4.5:1)
 *  - text/muted: jerarquía clara entre texto principal y secundario
 *  - border: sutil, no distractivo
 */
export const THEME_CONFIG = {

  // ── Greenlife Signature ─────── El look oficial de la marca (Optimizado: Obsidian & Emerald)
  greenlife: {
    id: 'greenlife',
    name: 'Greenlife Premium',
    description: 'Dorado sobre Bosque · Identidad Corporativa',
    bg: '#0A1F10',      card: 'rgba(22, 51, 34, 0.7)',
    brand: '#C9A84C',   brandRgb: '201, 168, 76',
    text: '#FFFFFF',    muted: 'rgba(255, 255, 255, 0.6)',
    border: 'rgba(201, 168, 76, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    animation: { easing: 'cubic-bezier(0.22, 1, 0.36, 1)', duration: '0.4s' },
  },

  // ── Yuma Desert ────── Cálido, tonos tierra
  desert: {
    id: 'desert',
    name: 'Desert',
    description: 'Tonos tierra · Arena de Arizona',
    bg: '#1A1410',      card: '#2A1D15',
    brand: '#F59E0B',   brandRgb: '245, 158, 11',
    text: '#FFF9ED',    muted: '#D4A050',
    border: 'rgba(245, 158, 11, 0.12)',
    shadow: 'rgba(245, 158, 11, 0.15)',
    animation: { easing: 'cubic-bezier(0.22, 1, 0.36, 1)', duration: '0.35s' },
  },

  // ── Irrigation Oasis ────── Riego y Agua
  oasis: {
    id: 'oasis',
    name: 'Oasis',
    description: 'Azules profundos · Agua y Riego',
    bg: '#0A111F',      card: '#111C30',
    brand: '#06B6D4',   brandRgb: '6, 182, 212',
    text: '#F4F3FA',    muted: '#9E9BB3',
    border: 'rgba(6, 182, 212, 0.15)',
    shadow: 'rgba(6, 182, 212, 0.15)',
    animation: { easing: 'cubic-bezier(0.19, 1, 0.22, 1)', duration: '0.3s' },
  },

  // ── Hardscape Slate ─────────── Piedra y Pavimento
  hardscape: {
    id: 'hardscape',
    name: 'Hardscape',
    description: 'Gris pizarra · Pavimentación',
    bg: '#111827',      card: '#1F2937',
    brand: '#4ADE80',   brandRgb: '74, 222, 128',
    text: '#FFFFFF',    muted: '#9CA3AF',
    border: 'rgba(74, 222, 128, 0.15)',
    shadow: 'rgba(74, 222, 128, 0.1)',
    animation: { easing: 'linear', duration: '0.2s' },
  },

};

/**
 * SMOKE RINGS — Tipografías Curadas
 * Solo incluye fuentes con buena legibilidad en densidades de texto reales.
 * Todas disponibles via Google Fonts (ya cargadas en index.css).
 */
export const FONT_CONFIG = {
  quicksand: {
    id: 'quicksand',
    name: 'Quicksand',
    family: '"Quicksand", sans-serif',
    desc: 'Amigable · Redondo',
    sample: 'Aa Bb Cc 123',
  },
  montserrat: {
    id: 'montserrat',
    name: 'Montserrat',
    family: '"Montserrat", sans-serif',
    desc: 'Geométrico · Profesional',
    sample: 'Aa Bb Cc 123',
  },
  fredoka: {
    id: 'fredoka',
    name: 'Fredoka',
    family: '"Fredoka", sans-serif',
    desc: 'Expresivo · Premium',
    sample: 'Aa Bb Cc 123',
  },
  comfortaa: {
    id: 'comfortaa',
    name: 'Comfortaa',
    family: '"Comfortaa", cursive',
    desc: 'Circular · Elegante',
    sample: 'Aa Bb Cc 123',
  },
};
