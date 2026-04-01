import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-0':      'var(--bg-0)',
        'bg-1':      'var(--bg-1)',
        'bg-2':      'var(--bg-2)',
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        'accent-mint':     'var(--accent-mint)',
        'accent-cyan':     'var(--accent-cyan)',
        'accent-warn':     'var(--accent-warn)',
        'accent-alert':    'var(--accent-alert)',
        'accent-mint-dim': 'var(--accent-mint-dim)',
        'accent-cyan-dim': 'var(--accent-cyan-dim)',
        'text-0': 'var(--text-0)',
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
      },
      borderColor: {
        soft:   'var(--border-soft)',
        med:    'var(--border-med)',
        strong: 'var(--border-strong)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        panel:      'var(--shadow-panel)',
        elevated:   'var(--shadow-elevated)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
}

export default config
