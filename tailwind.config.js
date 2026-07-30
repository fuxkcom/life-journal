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
				// 纸张背景：暖亚麻纸色，比标准米色更沉一点，呼应"笔记本纸张"的主题
				background: '#F3EEE1',
				foreground: '#241F1C',
				// terracotta 这个 token 名称在全站几十处地方复用（按钮/高亮/边框/焦点环等），
				// 把它整体换成"笔记本装订线"般的砖红色，即可让全站统一换上新配色，
				// 不需要逐个组件替换 class 名。
				terracotta: {
					DEFAULT: '#B23A48',
					50: '#FBF1F1',
					100: '#F6E1E1',
					200: '#EAC0C0',
					300: '#DA9797',
					400: '#C66868',
					500: '#B23A48',
					600: '#97303D',
					700: '#782531',
					800: '#591C24',
					900: '#3B1218',
				},
				stone: {
					50: '#FAF8F4',
					100: '#F1ECE1',
					200: '#E2DBCB',
					300: '#CBC0A9',
					400: '#A69C86',
					500: '#7D7361',
					600: '#5C5346',
					700: '#443D33',
					800: '#2C2722',
					900: '#1C1815',
				},
				cream: '#FAF6EA',
				primary: {
					DEFAULT: '#B23A48',
					foreground: '#FFFFFF',
				},
				secondary: {
					DEFAULT: '#F1ECE1',
					foreground: '#443D33',
				},
				accent: {
					DEFAULT: '#A9822F',
					foreground: '#1C1815',
				},
				destructive: {
					DEFAULT: '#DC2626',
					foreground: '#FFFFFF',
				},
				muted: {
					DEFAULT: '#F1ECE1',
					foreground: '#7D7361',
				},
				card: {
					DEFAULT: '#FFFDF7',
					foreground: '#241F1C',
				},
			},
			borderRadius: {
				'3xl': '20px',
				'4xl': '28px',
				lg: '12px',
				md: '8px',
				sm: '6px',
			},
			fontFamily: {
				// 正文：Noto Sans SC，中文渲染更规整，配合 Inter 作为数字/拉丁字符补充
				sans: ['"Noto Sans SC"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
				// 标题：中文衬线字体，日记本封面/标题的质感
				serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
				// 手写体：日期戳、心情标签等点缀元素，呼应"手写日记"的主题
				hand: ['"Zhi Mang Xing"', '"Noto Sans SC"', 'cursive'],
			},
			boxShadow: {
				'soft': '0 4px 20px rgba(178, 58, 72, 0.08)',
				'soft-lg': '0 8px 40px rgba(178, 58, 72, 0.12)',
				'glow': '0 0 40px rgba(178, 58, 72, 0.15)',
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
