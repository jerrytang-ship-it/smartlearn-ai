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
        primary: {
          DEFAULT: "#4CC9F0",
          light: "#7DD8F4",
          dark: "#21B5E0",
          bg: "#E8F8FE",
        },
        secondary: {
          DEFAULT: "#7B2FF7",
          light: "#A06CF9",
          dark: "#5A10D4",
        },
        accent: {
          DEFAULT: "#F72585",
          light: "#F95FAA",
          dark: "#D01070",
        },
        success: {
          DEFAULT: "#06D6A0",
          light: "#3DE4BA",
          dark: "#04B386",
        },
        xp: {
          DEFAULT: "#FFD166",
          light: "#FFDF8E",
          dark: "#F5B800",
        },
        streak: {
          DEFAULT: "#FF6B35",
          light: "#FF8F63",
        },
      },
      boxShadow: {
        "btn": "0 4px 0 0",
        "btn-sm": "0 2px 0 0",
        "card": "0 2px 8px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.1)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        "bounce-in": "bounceIn 0.4s ease-out",
        "float": "float 3s ease-in-out infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
        "flame": "flame 0.6s ease-in-out infinite",
        "pop": "pop 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        bounceIn: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        flame: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.15) translateY(-2px)" },
        },
        pop: {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
