import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      breakpoints: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      tokens: {
        colors: {
          // Primary/Accent colors
          accent: {
            DEFAULT: { value: "#D97706" },
            hover: { value: "#B45309" },
            light: { value: "rgba(217, 119, 6, 0.1)" },
            lighter: { value: "rgba(217, 119, 6, 0.08)" },
            lightest: { value: "rgba(217, 119, 6, 0.04)" },
          },

          // Background colors
          bg: {
            DEFAULT: { value: "#FAF9F6" },
            card: { value: "#FFFFFF" },
            subtle: { value: "#FDFCFA" },
            muted: { value: "#F5F3EF" },
            hover: { value: "#EBE8E2" },
          },

          // Text colors
          text: {
            DEFAULT: { value: "#1C1917" },
            secondary: { value: "#44403C" },
            tertiary: { value: "#57534E" },
            muted: { value: "#78716C" },
            placeholder: { value: "#A8A29E" },
          },

          // Border colors
          border: {
            DEFAULT: { value: "#E8E4DE" },
            subtle: { value: "#F5F3EF" },
            accent: { value: "rgba(217, 119, 6, 0.3)" },
          },

          // Type tag colors (for BDL types)
          type: {
            // Procedure (RPC)
            proc: { value: "#2563EB" },
            procBg: { value: "#EFF6FF" },
            // Struct
            struct: { value: "#7C3AED" },
            structBg: { value: "#F5F3FF" },
            // Enum
            enum: { value: "#059669" },
            enumBg: { value: "#ECFDF5" },
            // Union
            union: { value: "#EA580C" },
            unionBg: { value: "#FFF7ED" },
            // Oneof
            oneof: { value: "#0891B2" },
            oneofBg: { value: "#ECFEFF" },
            // Custom
            custom: { value: "#78716C" },
            customBg: { value: "#F5F5F4" },
          },

          // HTTP Method colors
          http: {
            get: { value: "#059669" },
            post: { value: "#D97706" },
            put: { value: "#2563EB" },
            patch: { value: "#7C3AED" },
            delete: { value: "#DC2626" },
            default: { value: "#78716C" },
          },

          // Error colors
          error: {
            DEFAULT: { value: "#DC2626" },
            bg: { value: "#FEF2F2" },
            border: { value: "#FECACA" },
          },

          // Folder/File icon colors
          folder: {
            closed: { value: "#D4A574" },
            open: { value: "#E8C89A" },
            stroke: { value: "#B8956E" },
          },
          file: {
            fill: { value: "#E8E4DE" },
            stroke: { value: "#A8A29E" },
          },

          // Overlay
          overlay: { value: "rgba(0, 0, 0, 0.5)" },
        },
        shadows: {
          card: { value: "0 1px 3px rgba(0, 0, 0, 0.04)" },
          dropdown: { value: "0 2px 8px rgba(0, 0, 0, 0.08)" },
          dialog: { value: "0 16px 70px rgba(0, 0, 0, 0.2)" },
          accent: { value: "0 2px 8px rgba(217, 119, 6, 0.25)" },
          accentHover: { value: "0 4px 12px rgba(217, 119, 6, 0.35)" },
          hover: { value: "0 4px 12px rgba(0, 0, 0, 0.06)" },
          sidebar: { value: "2px 0 8px rgba(0, 0, 0, 0.03)" },
          mobileBtn: { value: "0 2px 8px rgba(0, 0, 0, 0.1)" },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
