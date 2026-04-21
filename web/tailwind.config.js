/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#444444",
          muted: "#6b7280",
          faint: "#9ca3af",
        },
        line: "#ececec",
        page: "#ffffff",
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Inter"', 'system-ui', 'sans-serif'],
        reader: ['"Iowan Old Style"', '"Charter"', '"Georgia"', '"Times New Roman"', 'serif'],
      },
      maxWidth: {
        reader: "680px",
      },
    },
  },
  plugins: [],
};
