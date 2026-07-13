import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0B2E63", deep: "#071E44", ink: "#051530" },
        brand: { blue: "#1263D8", bluesoft: "#E8F0FC", red: "#E11931", redsoft: "#FDEBEE" },
        ink: "#0F1722",
        slate2: "#4A5A72",
        mist: "#64748B",
        cloud: "#F4F7FB",
        line: "#E2E9F4",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: { card: "20px", tile: "14px" },
      boxShadow: {
        soft: "0 8px 30px rgba(11,46,99,.08)",
        deep: "0 20px 60px rgba(7,30,68,.18)",
        cta: "0 6px 18px rgba(18,99,216,.35)",
        ctaRed: "0 6px 18px rgba(225,25,49,.30)",
      },
    },
  },
  plugins: [],
};
export default config;
