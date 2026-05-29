import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
      fontFamily: {
        sans: ["Figtree", "ui-sans-serif", "system-ui"],
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
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9", 
          200: "#e2e8f0",
          400: "#cbd5e1",
          500: "#94a3b8",
          600: "#64748b",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        gray: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          700: "#374151",
          800: "#1f2937",
          900: "#111827"
        },
        emerald: {
          400: "#4ade80",
          500: "#10b981",
          600: "#059669"
        },
        indigo: {
          500: "#6366f1",
          600: "#4f46e5"
        },
        purple: {
          600: "#9333ea"
        },
        red: {
          50: "#fef2f2",
          100: "#fee2e2",
          600: "#dc2626",
          700: "#b91c1c"
        },
        amber: {
          500: "#f59e0b",
          600: "#d97706"
        },
        green: {
          600: "#059669",
          700: "#047857"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1.5rem",
        "2xl": "2rem"
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config

