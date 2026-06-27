import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0A0F1E",
        "navy-card": "#1E2A45",
        "navy-border": "#2A3A5C",
        amber: "#F5A623",
        "amber-dim": "#C47D10",
        danger: "#FF3B3B",
        "danger-dim": "#7A1A1A",
        safe: "#22C55E",
        "safe-dim": "#14532D",
        slate: "#8892A4",
        warning: "#FBBF24",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      animation: {
        "scan-line": "scan 2s linear infinite",
        "pulse-ring": "pulseRing 2s ease-out infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(0%)", opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0.3" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "1" },
          "100%": { transform: "scale(1.3)", opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
