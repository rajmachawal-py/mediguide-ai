/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Clinical Intelligence Design System ─────────────── */

        /* Primary: "Trust Anchor" — core navigation, CTAs */
        primary: {
          DEFAULT: '#00478D',
          container: '#005EB8',
          fixed: '#D6E3FF',
          'fixed-dim': '#A9C7FF',
          on: '#FFFFFF',
          'on-container': '#C8DAFF',
        },

        /* Secondary: "AI Intelligence" — AI insights, automated suggestions */
        secondary: {
          DEFAULT: '#7043C2',
          container: '#A97DFF',
          fixed: '#EBDDFF',
          'fixed-dim': '#D3BBFF',
          on: '#FFFFFF',
          'on-container': '#3D0088',
        },

        /* Tertiary: "Clinical Validation" — success, health-positive */
        tertiary: {
          DEFAULT: '#00541A',
          container: '#006F25',
          fixed: '#83FC8E',
          'fixed-dim': '#66DF75',
          on: '#FFFFFF',
        },

        /* Error / Emergency */
        error: {
          DEFAULT: '#BA1A1A',
          container: '#FFDAD6',
          on: '#FFFFFF',
          'on-container': '#93000A',
        },

        /* Triage Status Colors */
        emergency: {
          light: '#FFDAD6',
          DEFAULT: '#BA1A1A',
          dark: '#93000A',
        },
        moderate: {
          light: '#FFDEAE',
          DEFAULT: '#E68A00',
          dark: '#7A4900',
        },
        mild: {
          light: '#DAFEE0',
          DEFAULT: '#00541A',
          dark: '#003D12',
        },

        /* Surface System: Tonal Layering */
        surface: {
          DEFAULT: '#F8F9FA',
          dim: '#D9DADB',
          bright: '#F8F9FA',
          container: {
            DEFAULT: '#EDEEEF',
            low: '#F3F4F5',
            high: '#E7E8E9',
            highest: '#E1E3E4',
            lowest: '#FFFFFF',
          },
          variant: '#E1E3E4',
          tint: '#005DB6',
        },

        /* On-Surface (text colors) */
        'on-surface': {
          DEFAULT: '#191C1D',
          variant: '#424752',
        },

        /* Inverse */
        'inverse-surface': '#2E3132',
        'inverse-on-surface': '#F0F1F2',
        'inverse-primary': '#A9C7FF',

        /* Outline */
        outline: {
          DEFAULT: '#727783',
          variant: '#C2C6D4',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-md': ['2.5rem', { lineHeight: '1.15', fontWeight: '700' }],
        'title-lg': ['1.375rem', { lineHeight: '1.3', fontWeight: '700' }],
        'title-md': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'label-lg': ['0.875rem', { lineHeight: '1.4', fontWeight: '600' }],
        'label-md': ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],
        'label-sm': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.05em' }],
      },

      borderRadius: {
        'clinical': '0.75rem',
        'clinical-lg': '1rem',
        'clinical-xl': '1.25rem',
      },

      boxShadow: {
        'clinical': '0 2px 8px rgba(0, 71, 141, 0.06)',
        'clinical-md': '0 8px 24px rgba(0, 71, 141, 0.06)',
        'clinical-lg': '0 20px 40px rgba(0, 71, 141, 0.06)',
        'clinical-xl': '0 25px 60px rgba(0, 71, 141, 0.08)',
        'triage-emergency': '0 4px 16px rgba(186, 26, 26, 0.12)',
        'triage-moderate': '0 4px 16px rgba(230, 138, 0, 0.12)',
        'triage-mild': '0 4px 16px rgba(0, 84, 26, 0.12)',
      },

      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
