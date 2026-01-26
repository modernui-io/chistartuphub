/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    // GLOBAL OVERRIDE: No rounded corners anywhere
    borderRadius: {
      none: '0px',
      DEFAULT: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    extend: {
      // ═══════════════════════════════════════════
      // THE CHICAGO BUREAU DESIGN TOKENS
      // ═══════════════════════════════════════════
      colors: {
        // Bureau Core Palette
        'chi': {
          'navy': '#050A14',           // The Deep Background
          'grid': 'rgba(255, 255, 255, 0.15)',  // Structural Borders
          'whitewash': 'rgba(255, 255, 255, 0.95)', // High contrast text
          'white': '#FFFFFF',                      // Pure white text
          'silver': 'rgba(255, 255, 255, 0.85)',   // Silver text
          'muted': 'rgba(255, 255, 255, 0.50)',    // Secondary text
          'dim': 'rgba(255, 255, 255, 0.30)',      // Tertiary/index numbers
          'whisper': 'rgba(255, 255, 255, 0.05)',  // Subtle hover bg
          'ghost': 'rgba(255, 255, 255, 0.10)',    // Ghost borders
          'coral': '#FF6B6B',                      // Urgent/Hot accent
          'signal': '#4ADE80',                     // Active/Success
        },
        // Existing shadcn colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },

      // Typography - The Bureau Font Stack
      fontFamily: {
        'editorial': ['Playfair Display', 'Georgia', 'serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        // Noir Zine additions
        'display': ['Bebas Neue', 'Impact', 'sans-serif'],
        'headline': ['Archivo Black', 'Impact', 'sans-serif'],
      },

      // Spacing - Bureau Grid Units
      spacing: {
        'bureau': '80px',  // Standard grid cell
        'bureau-sm': '40px',
        'bureau-lg': '120px',
      },

      // Border Width
      borderWidth: {
        'bureau': '1px',
      },

      // Transitions - The "Hard Cut"
      transitionDuration: {
        '0': '0ms',
        'instant': '0ms',
      },

      // Z-Index Layers
      zIndex: {
        'atmosphere': '0',
        'overlay': '1',
        'grid-texture': '2',
        'content': '10',
        'dropdown': '40',
        'modal': '999',
        'header': '100',
        'modal-backdrop': '998',
      },

      // Animations
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
