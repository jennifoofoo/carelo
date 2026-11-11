import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        'xxs': '0.25rem',
        'xs': '0.5rem',
        'sm': '0.75rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
        '4xl': '4rem',
        '5xl': '5rem',
        '6xl': '7.5rem',
        // UNIFIED PITCH DECK SPACING SYSTEM (strict increments: 24/32/48/64px)
        'pitch-24': '24px',
        'pitch-32': '32px',
        'pitch-48': '48px',
        'pitch-64': '64px',
        'pitch-edge': '72px',           // Distance from edges to content
        'pitch-capsule-gap': '24px',    // Gap between capsule and heading
        'pitch-heading-gap': '32px',    // Gap below heading to subtitle
        'pitch-content-gap': '64px',    // Gap from subtitle to content
        'pitch-footer-bottom': '96px',  // CTA/footer from bottom
        'pitch-column-gap': '48px',     // Standard column gaps
        'pitch-card-padding': '24px',   // Standard card padding
        'pitch-qr-label-gap': '16px',   // Gap below QR to label
      },
      fontFamily: {
        'sans': ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'heading': ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'h1': ['clamp(1.75rem, 4vw + 0.5rem, 3rem)', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.025em' }],
        'h2': ['clamp(1.375rem, 3vw + 0.5rem, 2rem)', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.02em' }],
        'h3': ['clamp(1.125rem, 2vw + 0.25rem, 1.5rem)', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.015em' }],
        'h4': ['1rem', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '-0.01em' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'button': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
        // Pitch deck typography system
        'pitch-h1': ['clamp(48px, 6vw, 80px)', { lineHeight: '1.05', fontWeight: '800', letterSpacing: '-0.02em' }],
        'pitch-h2': ['clamp(32px, 4vw, 44px)', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.015em' }],
        'pitch-h3': ['clamp(22px, 2.5vw, 28px)', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
        'pitch-body-lg': ['clamp(20px, 2vw, 24px)', { lineHeight: '1.5', fontWeight: '400' }],
        'pitch-body': ['clamp(18px, 1.8vw, 22px)', { lineHeight: '1.5', fontWeight: '400' }],
        'pitch-body-sm': ['clamp(14px, 1.5vw, 18px)', { lineHeight: '1.5', fontWeight: '400' }],
        'pitch-label': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'pitch-caption': ['16px', { lineHeight: '1.4', fontWeight: '500' }],
        'pitch-stat': ['clamp(28px, 3vw, 36px)', { lineHeight: '1.1', fontWeight: '700' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: "hsl(var(--info))",
        disabled: "hsl(var(--disabled))",
        // Named brand colors
        orange: "hsl(var(--orange))",
        yellow: "hsl(var(--yellow))",
        sage: "hsl(var(--sage))",
        graphite: "hsl(var(--graphite))",
        "warm-grey": "hsl(var(--warm-grey))",
        "soft-warm": "hsl(var(--soft-warm))",
        "secondary-accent": "hsl(var(--secondary-accent))",
        // Pitch deck colors
        "pitch-bg": "hsl(var(--pitch-bg))",
        "pitch-text": "hsl(var(--pitch-text))",
        "pitch-heading": "hsl(var(--pitch-heading))",
        "pitch-subheading": "hsl(var(--pitch-subheading))",
        "pitch-body-color": "hsl(var(--pitch-body))",
        "pitch-muted": "hsl(var(--pitch-muted))",
        "pitch-border": "hsl(var(--pitch-border))",
        "pitch-caption-color": "hsl(var(--pitch-muted))",
        "pitch-problem": "hsl(var(--pitch-problem))",
        "pitch-problem-dark": "hsl(var(--pitch-problem-dark))",
        "pitch-solution": "hsl(var(--pitch-solution))",
        "pitch-solution-dark": "hsl(var(--pitch-solution-dark))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.5rem",
        "2xl": "0.75rem",
        "pitch-card": "16px",
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'elevated': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'focus': '0 0 0 2px hsl(var(--primary) / 0.2)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;