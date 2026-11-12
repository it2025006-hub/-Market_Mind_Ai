/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        bg2: 'var(--bg-2)',
        card: 'var(--card)',
        card2: 'var(--card-2)',
        line: 'var(--line)',
        ink: 'var(--text)',
        mute: 'var(--muted)',
        accent: 'var(--accent)',
        cyanx: 'var(--cyan)',
        bull: 'var(--bull)',
        bear: 'var(--bear)',
        amberx: 'var(--amber)',
      },
      boxShadow: {
        panel: '0 18px 50px rgba(2, 8, 20, 0.28)',
      },
    },
  },
  plugins: [],
}
