import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // NDE huisstijl: logo-blauw als primair, oranje als accent (docs.nde.nl)
        nde: {
          blue: '#0a3dfa',
          'blue-dark': '#0731c4',
          'blue-soft': '#eaeefe',
          orange: '#fa5200',
          'orange-dark': '#e44a00',
          ink: '#0b1020',
          muted: '#5b6577',
          line: '#e3e7ef',
          bg: '#f6f8fc',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,16,32,0.04), 0 8px 24px rgba(11,16,32,0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
