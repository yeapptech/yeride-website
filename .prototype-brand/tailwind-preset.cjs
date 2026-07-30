// YeRide shared Tailwind preset — consume via:
//   presets: [require('@yeapptech/yeride-brand/tailwind-preset')]
// Platform-neutral: works with Tailwind 3.4 (Astro, Next.js) and NativeWind 4.
const { colors, fontFamily, letterSpacing } = require('./tokens.cjs');

module.exports = {
  theme: {
    extend: {
      colors: {
        'cab-yellow': colors.cabYellow,
        'pullman-brown': colors.pullmanBrown,
        ink: colors.ink,
        paper: colors.paper,
      },
      fontFamily: {
        brand: fontFamily.brand,
      },
      letterSpacing: {
        wordmark: letterSpacing.wordmark,
        headline: letterSpacing.headline,
        caps: letterSpacing.caps,
      },
    },
  },
};
