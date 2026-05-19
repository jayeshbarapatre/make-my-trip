/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          "primary": "#0099D9",
          "primary-content": "#ffffff",
          "secondary-content": "#ffffff",
          "accent-content": "#ffffff",
          "neutral": "#3d4451",
          "neutral-content": "#ffffff",
          "info-content": "#ffffff",
          "success-content": "#ffffff",
          "warning-content": "#ffffff",
          "error-content": "#ffffff",
        },
      },
      {
        black: {
          ...require("daisyui/src/theming/themes")["black"],
          "primary": "#0099D9",
          "primary-content": "#ffffff",
          "secondary": "#9CA3AF",
          "secondary-content": "#fff",
        },
      },
      {
        business: {
          ...require("daisyui/src/theming/themes")["business"],
          "primary": "#0099D9",
          "primary-content": "#ffffff",
        },
      },
      "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
      "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
      "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
      "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter",
      "dim", "nord", "sunset", "caramellatte"
    ],
    darkTheme: "light",
    base: true,
    utils: true,
    logs: true,
  },
};
