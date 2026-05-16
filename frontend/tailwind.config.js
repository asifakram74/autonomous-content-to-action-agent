/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#05060a',
        'accent-cyan': '#00f2ff',
        'accent-purple': '#bc13fe',
      }
    },
  },
  plugins: [],
}
