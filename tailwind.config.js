/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "on-error-container": "#93000a",
        "on-surface": "#191c1d",
        "surface-tint": "#5e35f1",
        "surface-bright": "#f8f9fa",
        "tertiary-fixed-dim": "#ffb691",
        "primary-fixed-dim": "#c9beff",
        "on-surface-variant": "#484556",
        "surface": "#f8f9fa",
        "secondary-fixed-dim": "#c9beff",
        "surface-container": "#edeeef",
        "primary-container": "#6c47ff",
        "tertiary": "#8d3b00",
        "on-primary-fixed-variant": "#4500d8",
        "on-tertiary-fixed-variant": "#783100",
        "on-primary-fixed": "#1b0063",
        "inverse-on-surface": "#f0f1f2",
        "secondary-fixed": "#e6deff",
        "surface-dim": "#d9dadb",
        "surface-container-high": "#e7e8e9",
        "outline": "#797588",
        "on-tertiary-container": "#ffeae1",
        "on-secondary-container": "#423487",
        "on-primary-container": "#f1ebff",
        "on-secondary-fixed-variant": "#47398d",
        "surface-container-low": "#f3f4f5",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed": "#1b0161",
        "inverse-primary": "#c9beff",
        "primary": "#5323e6",
        "secondary-container": "#b0a2fd",
        "on-background": "#191c1d",
        "error": "#ba1a1a",
        "background": "#f8f9fa",
        "outline-variant": "#c9c3d9",
        "tertiary-fixed": "#ffdbcb",
        "on-secondary": "#ffffff",
        "surface-container-highest": "#e1e3e4",
        "on-tertiary-fixed": "#341100",
        "tertiary-container": "#b34d00",
        "error-container": "#ffdad6",
        "secondary": "#5f52a7",
        "surface-variant": "#e1e3e4",
        "surface-container-lowest": "#ffffff",
        "primary-fixed": "#e6deff",
        "on-primary": "#ffffff",
        "inverse-surface": "#2e3132",
        "on-error": "#ffffff"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "fontFamily": {
        "headline": ["Manrope"],
        "body": ["Inter"],
        "label": ["Inter"],
        "mono": ["JetBrains Mono"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
