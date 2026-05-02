import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        bone: "#ffffff",
        muted: "#a1a1aa",
        line: "#1f1f1f",
        // softer surface tones for the dark UI
        surface: "#0a0a0a",
        surfaceRaised: "#111111",
      },
      fontFamily: {
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.18em",
      },
      boxShadow: {
        luxe: "0 30px 60px -20px rgba(0,0,0,0.7)",
        ring: "0 0 0 1px rgba(255,255,255,0.08)",
      },
      backgroundImage: {
        spotlight:
          "radial-gradient(ellipse at top, rgba(255,255,255,0.10), transparent 60%)",
        "spotlight-bottom":
          "radial-gradient(ellipse at bottom, rgba(255,255,255,0.06), transparent 50%)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out both",
        shimmer: "shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
