/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        // semantic tokens driven by CSS variables
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        sub: 'rgb(var(--sub) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-ink': 'rgb(var(--primary-ink) / <alpha-value>)',
        critical: 'rgb(var(--critical) / <alpha-value>)',
        high: 'rgb(var(--high) / <alpha-value>)',
        medium: 'rgb(var(--medium) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        charcoal: {
          950: '#090d16',
          900: '#0f172a',
          850: '#131e33',
          800: '#1e293b',
          750: '#26344d',
          700: '#334155',
          600: '#475569'
        }
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px'
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / .25), 0 8px 24px -12px rgb(0 0 0 / .35)',
      },
    },
  },
  plugins: [],
}
