import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        bone: "#ffffff",
        muted: "#a1a1aa",
        line: "#1f1f1f",
      },
      fontFamily: {
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
