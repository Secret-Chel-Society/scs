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
        // Hockey-themed colors
        hockey: {
          ice: "hsl(200, 100%, 95%)",
          "ice-dark": "hsl(200, 100%, 85%)",
          blue: "hsl(217, 91%, 60%)",
          "blue-dark": "hsl(217, 91%, 50%)",
          red: "hsl(0, 84%, 60%)",
          "red-dark": "hsl(0, 84%, 50%)",
          silver: "hsl(220, 14%, 75%)",
          "silver-dark": "hsl(220, 14%, 65%)",
          gold: "hsl(45, 100%, 51%)",
          "gold-dark": "hsl(45, 100%, 41%)",
          green: "hsl(142, 76%, 36%)",
          "green-dark": "hsl(142, 76%, 26%)",
          purple: "hsl(262, 83%, 58%)",
          "purple-dark": "hsl(262, 83%, 48%)",
          orange: "hsl(25, 95%, 53%)",
          "orange-dark": "hsl(25, 95%, 43%)",
        },
        // Professional gradients
        gradient: {
          primary: "linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(200, 100%, 95%) 100%)",
          secondary: "linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(217, 91%, 60%) 100%)",
          success: "linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(200, 100%, 95%) 100%)",
          warning: "linear-gradient(135deg, hsl(45, 100%, 51%) 0%, hsl(25, 95%, 53%) 100%)",
          danger: "linear-gradient(135deg, hsl(0, 84%, 60%) 0%, hsl(25, 95%, 53%) 100%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // Hockey-themed animations
        "hockey-slide": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "championship-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
            transform: "scale(1)" 
          },
          "50%": { 
            boxShadow: "0 0 40px rgba(59, 130, 246, 0.8)",
            transform: "scale(1.05)" 
          },
        },
        "trophy-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "ice-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "puck-bounce": {
          "0%, 20%, 50%, 80%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-10px)" },
          "60%": { transform: "translateY(-5px)" },
        },
        "score-flash": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Hockey-themed animations
        "hockey-slide": "hockey-slide 2s ease-in-out infinite",
        "championship-glow": "championship-glow 2s ease-in-out infinite",
        "trophy-float": "trophy-float 3s ease-in-out infinite",
        "ice-shimmer": "ice-shimmer 2s linear infinite",
        "puck-bounce": "puck-bounce 1s ease-in-out infinite",
        "score-flash": "score-flash 0.5s ease-in-out",
      },
      // Professional spacing and sizing
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
      },
      // Enhanced shadows for depth
      boxShadow: {
        "hockey": "0 4px 20px rgba(59, 130, 246, 0.15)",
        "hockey-lg": "0 8px 40px rgba(59, 130, 246, 0.2)",
        "hockey-xl": "0 20px 80px rgba(59, 130, 246, 0.25)",
        "ice": "0 2px 10px rgba(200, 100%, 95%, 0.3)",
        "ice-lg": "0 4px 20px rgba(200, 100%, 95%, 0.4)",
      },
      // Professional backdrop blur
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
