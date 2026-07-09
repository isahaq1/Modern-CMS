import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: "var(--theme-primary)",
          secondary: "var(--theme-secondary)",
          bg: "var(--theme-bg)",
          text: "var(--theme-text)",
        },
      },
      fontFamily: {
        heading: "var(--theme-heading-font)",
        body: "var(--theme-body-font)",
      },
    },
  },
  plugins: [],
};

export default config;
