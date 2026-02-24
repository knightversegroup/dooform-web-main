/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
    '../../libs/shared/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
        },
        'text-default': 'var(--text-default)',
        'text-muted': 'var(--text-muted)',
        'muted-foreground': 'var(--text-muted)',
        'border-default': 'var(--border-default)',
        'surface-alt': 'var(--surface-alt)',
      },
      borderColor: {
        DEFAULT: 'var(--border-default)',
      },
    },
  },
  plugins: [],
};
