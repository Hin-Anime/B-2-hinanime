// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./src/**/*.css", // Add this line
    "./src/components/**/*.{js,jsx}", // Add component paths
    "./src/pages/**/*.{js,jsx}", // Add page paths
  ],
  safelist: [
    { pattern: /./ }, // TEMPORARY - allows all classes for testing
  ],
  theme: {
    extend: {
      height: {
        100: "600px",
        111: "386px",
        112: "43rem",
        97: "478px",
        98: "22rem",
        1.2: "5.375rem",
        113: "478px",
        114: "40rem",
        100.1: "24rem",
        120: "29rem",
        130: "28rem",
      },
      width: {
        100: "1274px",
        111: "258px",
        112: "640px",
        1.2: "79.75rem",
        113: "1274px",
        120: "55rem",
        130: "52rem",
        97: "38rem",
      },
      colors: {
        whitelite: "#5f5d6b80",
        whitegood: "#ffffff4d",
        customHover: "#36365e",
        customBg: "#0b0b41",
        customBt: "#1e1e39",
      },
      margin: {
        97: "55rem",
        0.1: "2px",
        2.1: "6px",
      },

      animation: {
        fadeIn: "fadeIn 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
            transform: "translateX(-50%) translateY(10px)",
          },
          "100%": { opacity: "1", transform: "translateX(-50%) translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
