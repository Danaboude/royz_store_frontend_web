import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          main: 'var(--theme-main)',
          light: 'var(--theme-light)',
          dark: 'var(--theme-dark)',
        },
        primary: {
          DEFAULT: '#2C2C54',
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#343A40',
          800: '#2C2C54',
          900: '#1B1B1B',
        },
        secondary: {
          DEFAULT: '#F8C291',
          50: '#FDFEFE',
          100: '#F8C291',
          200: '#F5CD79',
          300: '#E8B4A0',
          400: '#D4A574',
          500: '#C19A6B',
          600: '#A67C52',
          700: '#8B5A2F',
          800: '#6B4423',
          900: '#4A2F1A',
        },
        accent: {
          DEFAULT: '#F5CD79',
          50: '#FDFEFE',
          100: '#F8C291',
          200: '#F5CD79',
          300: '#F0B76A',
          400: '#E8A55C',
          500: '#D4944E',
          600: '#C18340',
          700: '#A67232',
          800: '#8B6124',
          900: '#705016',
        },
        neutral: {
          DEFAULT: '#FDFEFE',
          50: '#FDFEFE',
          100: '#F8F9FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#1B1B1B',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'Inter', 'system-ui', 'sans-serif'],
        tajawal: ['Tajawal', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config; 