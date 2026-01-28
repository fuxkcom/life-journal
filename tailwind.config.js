/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: '#FAFAF9',
				foreground: '#1C1917',
				terracotta: {
					DEFAULT: '#A87C5B',
					50: '#FAF7F5',
					100: '#F3EDE8',
					200: '#E5D6C9',
					300: '#D4BAA6',
					400: '#C19A7E',
					500: '#A87C5B',
					600: '#8C6349',
					700: '#6D4D39',
					800: '#4F382A',
					900: '#33241B',
				},
				stone: {
					50: '#FAFAF9',
					100: '#F5F5F4',
					200: '#E7E5E4',
					300: '#D6D3D1',
					400: '#A8A29E',
					500: '#78716C',
					600: '#57534E',
					700: '#44403C',
					800: '#292524',
					900: '#1C1917',
				},
				cream: '#FFFBF5',
				primary: {
					DEFAULT: '#A87C5B',
					foreground: '#FFFFFF',
				},
				secondary: {
					DEFAULT: '#F5F5F4',
					foreground: '#44403C',
				},
				accent: {
					DEFAULT: '#C19A7E',
					foreground: '#1C1917',
				},
				destructive: {
					DEFAULT: '#DC2626',
					foreground: '#FFFFFF',
				},
				muted: {
					DEFAULT: '#F5F5F4',
					foreground: '#78716C',
				},
				card: {
					DEFAULT: '#FFFFFF',
					foreground: '#1C1917',
				},
			},
			borderRadius: {
				'3xl': '24px',
				'4xl': '32px',
				lg: '12px',
				md: '8px',
				sm: '6px',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
			},
			boxShadow: {
				'soft': '0 4px 20px rgba(168, 124, 91, 0.08)',
				'soft-lg': '0 8px 40px rgba(168, 124, 91, 0.12)',
				'glow': '0 0 40px rgba(168, 124, 91, 0.15)',
			},
			keyframes: {
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
			},
			animation: {
				'fade-up': 'fade-up 0.6s ease-out',
				'fade-up-delay': 'fade-up 0.6s ease-out 0.2s both',
				'fade-in': 'fade-in 0.4s ease-out',
				'float': 'float 6s ease-in-out infinite',
			},
			transitionDuration: {
				'400': '400ms',
			},
			transitionTimingFunction: {
				'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}