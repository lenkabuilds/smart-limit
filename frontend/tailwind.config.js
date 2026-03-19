export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        ink:    '#0f1117',
        deep:   '#151921',
        panel:  '#1c2333',
        edge:   '#253047',
        dim:    '#3d4f6b',
        mist:   '#6b7fa3',
        smoke:  '#9aaac4',
        cloud:  '#c8d4e8',
        white:  '#f0f4ff',
        safe:   '#22c55e',
        warn:   '#f59e0b',
        threat: '#ef4444',
        info:   '#3b82f6',
        glow:   '#00d4aa',
      },
      boxShadow: {
        safe:   '0 0 30px rgba(34,197,94,0.2)',
        threat: '0 0 40px rgba(239,68,68,0.25)',
        glow:   '0 0 30px rgba(0,212,170,0.2)',
        card:   '0 4px 24px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
