// tailwind.config.js (ESM)
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        dropdown: 'dropdown 0.2s ease-out forwards'
      },
      keyframes: {
        dropdown: {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        }
      },
    },
  },
  plugins: [],
};
