import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Google Sans Flex'", 'system-ui', 'sans-serif'],
        sans: ["'Google Sans Flex'", 'system-ui', 'sans-serif'],
      },
      colors: {
        notion: {
          bg: '#FFFFFF',
          surface: '#F7F6F3',
          border: '#E8E8E5',
          text: '#37352F',
          secondary: '#787774',
          accent: '#EB5757',
          blue: '#2EAADC',
        },
      },
      maxWidth: {
        notion: '800px',
      },
    },
  },
  plugins: [],
}

export default config
