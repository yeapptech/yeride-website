/** @type {import('tailwindcss').Config} */
// PROTOTYPE (wayfinder #33) — the brand preset is vendored under .prototype-brand/
// because NPM_TOKEN isn't provisioned yet. The real wiring is
// `presets: [require('@yeapptech/yeride-brand/tailwind-preset')]` — ticket #35.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	presets: [require('./.prototype-brand/tailwind-preset.cjs')],
	theme: {
		extend: {},
	},
	plugins: [],
}
