export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
        display: ['Fredoka', 'sans-serif'],
        accent: ['Comfortaa', 'cursive'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          dark: 'var(--brand-dark, var(--brand))',
          light: 'var(--brand-light, var(--brand))',
        },
        surface: {
          DEFAULT: 'var(--bg-main)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-card)',
          hover: 'var(--bg-card)',
          border: 'var(--border-glass)',
        },
        text: {
          primary: 'var(--text-main)',
          main: 'var(--text-main)',
          secondary: 'var(--text-muted)',
          muted: 'var(--text-muted)',
        },
        status: {
          success: 'var(--success, #10B981)',
          warning: 'var(--warning, #F59E0B)',
          danger: 'var(--danger, #EF4444)',
          info: 'var(--info, #3B82F6)',
        }
      },
    },
  },
  plugins: [],
}