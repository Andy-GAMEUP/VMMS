/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBF5FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          400: '#3399FF',
          500: '#2680EB',
          600: '#1A65C7',
          700: '#0F4A9E',
        },
        success: {
          50: '#ECFDF5',
          500: '#22C55E',
          700: '#15803D',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          50: '#FFF1F2',
          500: '#EF4444',
          600: '#DC2626',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      spacing: {
        'sp-1': '4px',
        'sp-2': '8px',
        'sp-3': '12px',
        'sp-4': '16px',
        'sp-5': '20px',
        'sp-6': '24px',
        'sp-8': '32px',
        'sp-10': '40px',
      },
      fontSize: {
        'heading-lg': ['28px', { lineHeight: '1.3', fontWeight: '800', letterSpacing: '-0.5px' }],
        'heading': ['17px', { lineHeight: '1.4', fontWeight: '700' }],
        'title': ['14px', { lineHeight: '1.5', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', fontWeight: '500' }],
        'meta': ['12px', { lineHeight: '1.4', fontWeight: '600' }],
        'money': ['24px', { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.5px' }],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'badge': '20px',
        'input': '8px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        'bottom-nav': '0 -1px 3px rgba(0,0,0,0.08)',
      },
      minHeight: {
        'touch': '44px',
      },
      height: {
        'header': '52px',
        'bottom-nav': '60px',
      },
    },
  },
  plugins: [],
};
