import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
      },
      colors: {
        alabaster: "#FBFBF9",
        racing: {
          DEFAULT: "#1E3A2F",
          50: "#EEF3F0",
          400: "#3F6B58",
          600: "#1E3A2F",
          800: "#132620",
        },
        brass: {
          DEFAULT: "#B08D57",
          light: "#CDB07E",
          dark: "#8A6C3E",
        },
        oxblood: {
          DEFAULT: "#5C1A1B",
          light: "#7A2E2F",
        },
        bronze: "#9C7A4B",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        rise: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s var(--tw-transition-timing-function)",
        "slide-in-right": "slide-in-right 0.4s var(--tw-transition-timing-function)",
        rise: "rise 0.4s var(--tw-transition-timing-function)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
