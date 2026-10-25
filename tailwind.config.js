/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      // Dark, Flighty-style palette. Surfaces step up in brightness; ink steps down.
      colors: {
        bg: '#0B0C0F',
        surface: '#15171C',
        raised: '#1D2027',
        line: '#272B33',
        ink: {
          DEFAULT: '#F4F6FA',
          2: '#B4BAC5',
          3: '#7A818D',
          4: '#4F5560',
        },
        accent: {
          DEFAULT: '#4F8CFF',
          soft: '#8DB4FF',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(79,140,255,0.35), 0 8px 30px -6px rgba(79,140,255,0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulse_dot: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.35 },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-dot': 'pulse_dot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
