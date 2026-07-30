// YeRide design tokens — derived from tokens.json (source of truth).
// Edit tokens.json first, mirror here, then `npm run check`.

const colors = {
  cabYellow: '#F7B731',
  pullmanBrown: '#644117',
  ink: '#2A211A',
  paper: '#FBF8F3',
};

const fontFamily = {
  brand: ['Nunito', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
};

const fontWeight = {
  regular: 400,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

const letterSpacing = {
  wordmark: '-0.015em',
  headline: '-0.01em',
  caps: '0.08em',
};

module.exports = { colors, fontFamily, fontWeight, letterSpacing };
