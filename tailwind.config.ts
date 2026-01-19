import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Near-black base
        base: {
          DEFAULT: "var(--color-base)",
          50: "var(--color-base-50)",
          100: "var(--color-base-100)",
          200: "var(--color-base-200)",
          300: "var(--color-base-300)",
          400: "var(--color-base-400)",
        },
        // Warm graphite surfaces
        surface: {
          DEFAULT: "var(--color-surface)",
          elevated: "var(--color-surface-elevated)",
          hover: "var(--color-surface-hover)",
        },
        // Borders
        border: {
          DEFAULT: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
        },
        // Typography
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        // Priority colors
        priority: {
          high: "var(--color-priority-high)",
          "high-muted": "var(--color-priority-high-muted)",
          medium: "var(--color-priority-medium)",
          "medium-muted": "var(--color-priority-medium-muted)",
          low: "var(--color-priority-low)",
          "low-muted": "var(--color-priority-low-muted)",
        },
        // Accent
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          muted: "var(--color-accent-muted)",
        },
        // Success (for completed tasks/habits)
        success: {
          DEFAULT: "var(--color-success)",
          muted: "var(--color-success-muted)",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
      },
      spacing: {
        sidebar: "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-width-collapsed)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-in-left": "slideInLeft 200ms ease-out",
        "slide-in-up": "slideInUp 200ms ease-out",
        "scale-in": "scaleIn 150ms ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInLeft: {
          from: { transform: "translateX(-8px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        slideInUp: {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
