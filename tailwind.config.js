/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4CAF50",
          dark: "#388E3C",
          light: "#C8E6C9",
        },
        secondary: {
          DEFAULT: "#FFC107",
          dark: "#FFA000",
          light: "#FFECB3",
        },
        accent: {
          DEFAULT: "#9C27B0",
          dark: "#7B1FA2",
          light: "#E1BEE7",
        },
        background: "#F5F5F5",
        text: {
          DEFAULT: "#333333",
          muted: "#757575",
        }
      },
      fontFamily: {
        // You can add custom fonts here later
      }
    },
  },
  plugins: [],
};
