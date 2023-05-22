/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      height: {
        '128': '32rem',
      },
      width: {
        '128': '32rem',
        '148': '40rem',

      }
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}