import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lato", "system-ui", "sans-serif"],
        heading: ['"Expletus Sans"', "system-ui", "sans-serif"],
        button: ["Inter", "system-ui", "sans-serif"],
        brand: ["Yorizon", '"Expletus Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        sm: "5px",
        md: "10px",
        DEFAULT: "14px",
        lg: "15px",
        xl: "20px",
        pill: "30px",
        full: "40px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
export default config;
