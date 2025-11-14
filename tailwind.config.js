/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ChatGPT-inspired color palette
        chat: {
          bg: {
            light: '#ffffff',
            dark: '#343541',
          },
          sidebar: {
            light: '#f7f7f8',
            dark: '#202123',
          },
          message: {
            user: {
              light: '#19c37d',
              dark: '#10a37f',
            },
            assistant: {
              light: '#f7f7f8',
              dark: '#444654',
            },
          },
          border: {
            light: '#e5e5e5',
            dark: '#565869',
          },
          text: {
            primary: {
              light: '#353740',
              dark: '#ececf1',
            },
            secondary: {
              light: '#6e6e80',
              dark: '#8e8ea0',
            },
          },
        },
      },
      borderRadius: {
        'chat': '0.75rem',
      },
      boxShadow: {
        'chat': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'chat-dark': '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}


