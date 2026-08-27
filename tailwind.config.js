/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Clinical, calm palette — deep teal (trust/medical) + warm clay accent
        // (deliberately not the generic AI-blue-on-white healthcare template).
        clinic: {
          50: "#EEF6F4",
          100: "#D6E9E4",
          200: "#AED3C8",
          300: "#7FB8A9",
          400: "#4C9C88",
          500: "#0F6B5C", // primary
          600: "#0C5A4D",
          700: "#0A483F",
          800: "#073731",
          900: "#052622",
        },
        clay: {
          50: "#FBF3EE",
          100: "#F3DED0",
          400: "#D98A5F",
          500: "#C06B3C", // accent — alerts, CTAs that need warmth
          600: "#9E5530",
        },
        surface: {
          light: "#F7FAF9",
          dark: "#0B1512",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(7, 55, 49, 0.06), 0 4px 12px rgba(7, 55, 49, 0.08)",
      },
    },
  },
  plugins: [],
};
