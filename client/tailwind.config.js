/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201c",
        moss: "#47624f",
        mint: "#d9f0df",
        coral: "#f9735b",
        wheat: "#f4efe4"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(23, 32, 28, 0.08)"
      }
    }
  },
  plugins: []
};

