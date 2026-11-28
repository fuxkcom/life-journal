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
				// 纸张背景：暖奶油色，比原来的亚麻纸更亮更柔，像刚晒过的棉布，
				// 全站底色统一用它，告别冷灰白。
				background: '#FAF4E6',
				foreground: '#2C2722',
				// terracotta 这个 token 名称在全站几十处地方复用（按钮/高亮/边框/焦点环等），
				// 把它整体换成暖陶土橘（偏橘的陶土色，比原来的砖红更暖更柔），
				// 即可让全站统一换上新配色，不需要逐个组件替换 class 名。
				// 500 号色与白字对比度约 5:1，按钮白字清晰可读。
				terracotta: {
					DEFAULT: '#B4502F',
					50: '#FBF0E6',
					100: '#F5DCC8',
					200: '#EAB894',
					300: '#DD9168',
					400: '#C96A42',
					500: '#B4502F',
					600: '#9C4426',
					700: '#7E371F',
					800: '#5F2A18',
					900: '#3F1D11',
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
				cream: '#FBF3DF',
				primary: {
					DEFAULT: '#B4502F',
					foreground: '#FFFFFF',
				},
				secondary: {
					DEFAULT: '#F1ECE1',
					foreground: '#443D33',
				},
				// 点缀：暖金/琥珀色，用于徽章、描边和次级强调
				accent: {
					DEFAULT: '#B08A2E',
					foreground: '#1C1815',
				},
				destructive: {
					DEFAULT: '#C0452F',
					foreground: '#FFFFFF',
				},
				muted: {
					DEFAULT: '#F1ECE1',
					foreground: '#7D7361',
				},
				card: {
					DEFAULT: '#FFFDF6',
					foreground: '#2C2722',
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
				// 正文：Noto Sans SC，中文渲染更规整，配合 Inter 作为数字/拉丁字符补充；
				// Google Fonts 加载失败时回退到苹方 / 微软雅黑，依然是圆润的中文黑体，不会变丑。
				sans: [
				'"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans SC"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
			],
				// 标题：中文衬线字体，日记本封面/标题的质感；
				// 加载失败时回退到宋体（宋體 / STSong），仍保留衬线文艺气。
				serif: [
				'"Songti SC"', '"STSong"', '"Noto Serif SC"', 'SimSun', 'Georgia', '"Times New Roman"', 'serif',
			],
				// 手写体：日期戳、心情标签等点缀元素，呼应"手写日记"的主题
				hand: [
				'"Kaiti SC"', '"STKaiti"', '"KaiTi"', '"Noto Sans SC"', 'cursive',
			],
			},
			boxShadow: {
				// 暖色阴影：陶土橘的柔光，卡片浮在奶油底色上更温润
				'soft': '0 4px 20px rgba(180, 80, 47, 0.08)',
				'soft-lg': '0 10px 36px rgba(180, 80, 47, 0.14)',
				'glow': '0 0 40px rgba(180, 80, 47, 0.16)',
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
