import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6D8EA0',
          dark: '#456B7E',
        },
        accent: {
          DEFAULT: '#7FB685',
          surface: '#E8F4EA',
        },
        background: '#F7F8FA',
        surface: '#FFFFFF',
        ink: '#17303C',
        muted: '#6B7F89',
        line: '#E2E9ED',
        warning: '#E8B762',
      },
      borderRadius: {
        card: '22px',
        button: '18px',
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '"Microsoft JhengHei"', '"PingFang TC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
