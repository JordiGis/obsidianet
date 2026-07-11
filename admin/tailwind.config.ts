import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: "#ffffff",
          sidebar: "#f7f6f3",
          text: "#37352f",
          muted: "#787066",
          border: "#e9e8e4",
          hover: "#efefee",
          blue: "#2383e2",
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
