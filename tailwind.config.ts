// Midnight Studios INTl - All rights reserved
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* === Logo-based palette, mapped to CSS vars === */

        // Gold scale (replaces old ice blue)
        "ice-blue": {
          25: "hsl(var(--ice-blue-50))",
          50: "hsl(var(--ice-blue-50))",
          100: "hsl(var(--ice-blue-100))",
          200: "hsl(var(--ice-blue-200))",
          300: "hsl(var(--ice-blue-300))",
          400: "hsl(var(--ice-blue-400))",
          500: "hsl(var(--ice-blue-500))", // main gold
          600: "hsl(var(--ice-blue-600))",
          700: "hsl(var(--ice-blue-700))",
          800: "hsl(var(--ice-blue-800))",
          900: "hsl(var(--ice-blue-900))",
          950: "hsl(var(--ice-blue-900))",
        },

        // Bronze scale (replaces old rink blue)
        "rink-blue": {
          25: "hsl(var(--rink-blue-50))",
          50: "hsl(var(--rink-blue-50))",
          100: "hsl(var(--rink-blue-100))",
          200: "hsl(var(--rink-blue-200))",
          300: "hsl(var(--rink-blue-300))",
          400: "hsl(var(--rink-blue-400))",
          500: "hsl(var(--rink-blue-500))", // main bronze
          600: "hsl(var(--rink-blue-600))",
          700: "hsl(var(--rink-blue-700))",
          800: "hsl(var(--rink-blue-800))",
          900: "hsl(var(--rink-blue-900))",
          950: "hsl(var(--rink-blue-900))",
        },

        // Warm silver / stone (replaces slate-ish greys)
        "hockey-silver": {
          50: "hsl(var(--hockey-silver-50))",
          100: "hsl(var(--hockey-silver-100))",
          200: "hsl(var(--hockey-silver-200))",
          300: "hsl(var(--hockey-silver-300))",
          400: "hsl(var(--hockey-silver-400))",
          500: "hsl(var(--hockey-silver-500))",
          600: "hsl(var(--hockey-silver-600))",
          700: "hsl(var(--hockey-silver-700))",
          800: "hsl(var(--hockey-silver-800))",
          900: "hsl(var(--hockey-silver-900))",
          950: "hsl(var(--hockey-silver-900))",
        },

        // Keep red & green as functional colors
        "goal-red": {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        "assist-green": {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "gradient-x": {
          "0%, 100%": {
            backgroundSize: "200% 200%",
            backgroundPosition: "left center",
          },
          "50%": {
            backgroundSize: "200% 200%",
            backgroundPosition: "right center",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        // switched to gold-ish glow instead of blue
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(245, 158, 11, 0.35)",
          },
          "50%": {
            boxShadow:
              "0 0 30px rgba(245, 158, 11, 0.7), 0 0 40px rgba(202, 138, 4, 0.4)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-x": "gradient-x 3s ease infinite",
        float: "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "slide-in-right": "slide-in-right 0.5s ease-out",
        "slide-in-left": "slide-in-left 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
      },

      scale: {
        102: "1.02",
        103: "1.03",
      },

      boxShadow: {
        "3xl": "0 35px 60px -12px rgba(0, 0, 0, 0.25)",
        // gold glow instead of blue glow
        "hockey-glow":
          "0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(202, 138, 4, 0.2)",
        "hockey-glow-lg":
          "0 0 30px rgba(245, 158, 11, 0.5), 0 0 60px rgba(202, 138, 4, 0.3)",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // still a subtle pattern, but you can tweak the color if you want it warmer
        "hockey-pattern":
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3e8c9' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
