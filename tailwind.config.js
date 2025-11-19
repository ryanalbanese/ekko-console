/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', "class"],
  theme: {
  	extend: {
  		colors: {
  			border: "hsl(var(--border))",
  			input: "hsl(var(--input))",
  			ring: "hsl(var(--ring))",
  			background: "hsl(var(--background))",
  			foreground: "hsl(var(--foreground))",
  			card: {
  				DEFAULT: "hsl(var(--card))",
  				foreground: "hsl(var(--card-foreground))",
  			},
  			popover: {
  				DEFAULT: "hsl(var(--popover))",
  				foreground: "hsl(var(--popover-foreground))",
  			},
  			primary: {
  				DEFAULT: "hsl(var(--primary))",
  				foreground: "hsl(var(--primary-foreground))",
  			},
  			secondary: {
  				DEFAULT: "hsl(var(--secondary))",
  				foreground: "hsl(var(--secondary-foreground))",
  			},
  			destructive: {
  				DEFAULT: "hsl(var(--destructive))",
  				foreground: "hsl(var(--destructive-foreground))",
  			},
  			muted: {
  				DEFAULT: "hsl(var(--muted))",
  				foreground: "hsl(var(--muted-foreground))",
  			},
  			accent: {
  				DEFAULT: "hsl(var(--accent))",
  				foreground: "hsl(var(--accent-foreground))",
  			},
  			chat: {
  				bg: {
  					light: '#ffffff',
  					dark: '#343541'
  				},
  				sidebar: {
  					light: '#f7f7f8',
  					dark: '#202123'
  				},
  				message: {
  					user: {
  						light: '#19c37d',
  						dark: '#10a37f'
  					},
  					assistant: {
  						light: '#f7f7f8',
  						dark: '#444654'
  					}
  				},
  				border: {
  					light: '#e5e5e5',
  					dark: '#565869'
  				},
  				text: {
  					primary: {
  						light: '#353740',
  						dark: '#ececf1'
  					},
  					secondary: {
  						light: '#6e6e80',
  						dark: '#8e8ea0'
  					}
  				}
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: "var(--radius)",
  			md: "calc(var(--radius) - 2px)",
  			sm: "calc(var(--radius) - 4px)",
  			chat: '0.75rem'
  		},
  		boxShadow: {
  			chat: '0 2px 8px rgba(0, 0, 0, 0.1)',
  			'chat-dark': '0 2px 8px rgba(0, 0, 0, 0.3)'
  		}
  	}
  },
  plugins: [],
}


