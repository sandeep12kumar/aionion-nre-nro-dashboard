/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Aionion Capital: the logo's blue and pink
        brand: { blue: "#0023FF", pink: "#FE667C", navy: "#0B1240" },
        // the accent scale, built around the Aionion blue (600)
        primary: {
          50: "#eef1ff",
          100: "#dfe4ff",
          200: "#c2ccff",
          300: "#98a7ff",
          400: "#6176ff",
          500: "#3049ff",
          600: "#0023ff",
          700: "#001cd6",
          800: "#0017ab",
          900: "#001485",
          950: "#000c52",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(90deg, #0023FF 0%, #6D3BF5 50%, #FE667C 100%)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 30px -12px rgba(15, 23, 42, 0.12)",
        lift: "0 18px 40px -16px rgba(15, 23, 42, 0.22)",
        brand: "0 10px 24px -10px rgba(0, 35, 255, 0.55)",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
