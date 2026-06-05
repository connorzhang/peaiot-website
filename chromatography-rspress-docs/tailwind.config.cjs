/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false, // 核心！禁用 Tailwind 的默认样式重置，防止破坏 Rspress 自带的美观 UI
  },
  content: [
    './docs/**/*.mdx',
    './docs/**/*.md',
    './components/**/*.{js,jsx,ts,tsx}',
    './theme/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};