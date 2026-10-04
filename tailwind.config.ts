import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/** Semantic colour tokens resolve through CSS variables, so every palette re-themes the whole UI. */
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-heading)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        canvas: token("canvas"),
        panel: token("panel"),
        ink: token("ink"),
        subtle: token("subtle"),
        edge: token("edge"),
        accent: token("accent"),
        onaccent: token("onaccent"),
        glow: token("glow"),
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.22, 1, 0.36, 1)",
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        rise: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(var(--c-glow) / 0.55)", opacity: "1" },
          "50%": { boxShadow: "0 0 0 8px rgb(var(--c-glow) / 0)", opacity: "0.75" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        rise: "rise 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;
