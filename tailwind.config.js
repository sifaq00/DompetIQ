/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        brand: {
          50: '#f0f4ff',   // Very light blue
          100: '#e0e9ff',
          500: '#1f57e7',  // Primary Brand Blue
          600: '#1741b5',  // Darker Brand Blue
          900: '#0b1d52',  // Deep Corporate Blue
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          500: '#64748b',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular', 'sans-serif'],
        medium: ['PlusJakartaSans_500Medium', 'sans-serif'],
        semibold: ['PlusJakartaSans_600SemiBold', 'sans-serif'],
        bold: ['PlusJakartaSans_700Bold', 'sans-serif'],
        extrabold: ['PlusJakartaSans_800ExtraBold', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
