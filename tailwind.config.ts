import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
        'surface-3': 'hsl(var(--surface-3) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        'border-strong': 'hsl(var(--border-strong) / <alpha-value>)',
        fg: 'hsl(var(--fg) / <alpha-value>)',
        'fg-muted': 'hsl(var(--fg-muted) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-2': 'hsl(var(--accent-2) / <alpha-value>)',
        'accent-fg': 'hsl(var(--accent-fg) / <alpha-value>)',
        'accent-soft': 'hsl(var(--accent-soft) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 hsl(222 47% 11% / 0.04), 0 1px 3px 0 hsl(222 47% 11% / 0.06)',
        elevated:
          '0 1px 2px 0 hsl(222 47% 11% / 0.05), 0 8px 24px -8px hsl(222 47% 11% / 0.12), 0 2px 6px -2px hsl(222 47% 11% / 0.08)',
        floating:
          '0 4px 12px -2px hsl(222 47% 11% / 0.10), 0 16px 48px -12px hsl(222 47% 11% / 0.18)',
        glow: '0 0 0 1px hsl(var(--accent) / 0.35), 0 8px 28px -8px hsl(var(--accent) / 0.45)',
        'glow-soft': '0 8px 32px -12px hsl(var(--accent) / 0.35)',
        'inner-border': 'inset 0 0 0 1px hsl(var(--border) / 0.6)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      backgroundImage: {
        'gradient-accent':
          'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent-2)) 100%)',
        'gradient-accent-soft':
          'linear-gradient(135deg, hsl(var(--accent) / 0.15) 0%, hsl(var(--accent-2) / 0.05) 100%)',
        'gradient-radial':
          'radial-gradient(circle at top, hsl(var(--accent) / 0.12), transparent 60%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--accent) / 0.4)' },
          '50%': { boxShadow: '0 0 0 6px hsl(var(--accent) / 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 280ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'fade-in-up': 'fade-in-up 360ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
