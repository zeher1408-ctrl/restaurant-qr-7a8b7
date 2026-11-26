import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        primary: "#9d4300",
        "primary-container": "#f97316",
        "on-primary": "#ffffff",
        background: "#f8f9ff",
        surface: "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#584237",
        outline: "#8c7164",
        "outline-variant": "#e0c0b1",
        tertiary: "#006c49",
        "tertiary-container": "#00b07a",
        secondary: "#565e74",
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
