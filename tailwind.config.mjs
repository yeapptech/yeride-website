import brandPreset from '@yeapptech/yeride-brand/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
	presets: [brandPreset],
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			// #123: name the family the font we actually load declares.
			//
			// CONSUMING.md §4 prescribes `@fontsource-variable/nunito` for web, and
			// BaseLayout imports it — but every @font-face in that package declares
			// `'Nunito Variable'`, while the brand token's stack leads with plain
			// `Nunito`. Nothing on the site asked for the family that was loaded, so
			// every page rendered in the OS font: measured live, the homepage <h1>
			// came out identical to `system-ui`, and `Nunito` measured identical to a
			// font name that does not exist.
			//
			// This PREPENDS to the token rather than restating it — the array is read
			// from the preset, so the fallback stack still has exactly one author, and
			// CONSUMING.md's "no locally restated font stacks" holds. Plain `Nunito`
			// stays right behind it, which is what mobile loads (§4 sends Expo to
			// `@expo-google-fonts/nunito`) and what a locally installed copy answers to.
			//
			// Delete this once the brand package ships a token that names the family
			// its own prescribed package declares — yeapptech/yeride-brand#191.
			// Nothing enforces that deletion, so until it happens the built CSS
			// carries TWO disagreeing brand stacks: this one, and `--font-brand` from
			// the package's own `tokens.css`, which BaseLayout also imports and which
			// still leads with plain `Nunito`. No rule reads that custom property
			// today — `font-brand` below is the only consumer, on `<body>` — but
			// anyone who reaches for `var(--font-brand)` gets the system font back.
			// Use the utility, not the variable, until #191 lands.
			fontFamily: {
				brand: ['Nunito Variable', ...brandPreset.theme.extend.fontFamily.brand],
			},
		},
	},
	plugins: [],
}
