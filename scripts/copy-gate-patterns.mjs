// The copy-gate pattern list — docs/copy-map.md §5, on the copy-map/en-es branch
// until it merges. Wayfinder #41 authored it; #57 moved it here so the source
// gate and the dist gate match the *same* list. Two lists would drift, and a
// pattern that exists in one gate and not the other is worse than no pattern:
// it reads as covered.
//
// Editing this list changes what both gates forbid. §5 is the authority; this is
// its transcription, not a place to loosen a rule that turned out inconvenient.
//
// Three §5 rules are judgement, not regex, and are checked by neither gate — they
// stay human review at copy time:
//   - copy claiming a visible per-trip fee breakdown in the app
//   - invented per-trip price or earnings comparisons against Uber or Lyft
//   - safety claims beyond Fla. Stat. § 627.748

export const PATTERNS = [
  // Gated until positioning obligations 1–3 all ship (driver pillar 2).
  { re: /see the math/i, why: "gated: driver pillar 2, obligations 1–3" },
  { re: /cuentas claras/i, why: "gated: driver pillar 2, obligations 1–3" },

  // Gated until YeRide actually has insurance coverage (#48). There is no
  // pass-through family today: insurance does not exist and card processing is
  // Stripe billing the driver's own connected account, not YeRide forwarding it.
  { re: /\bat[- ]cost\b/i, why: "gated on #48: nothing is passed through at cost" },
  { re: /\bal costo\b/i, why: "gated on #48: nothing is passed through at cost" },
  // The separator is required, as §5 writes it. The one-word "passthrough" is
  // only ever an identifier here (ChargeFamily, the family filter), never a claim.
  { re: /\bpass(es|ed|ing)?[- ]through\b/i, why: "gated on #48: the pass-through family has no members" },
  { re: /\b(zero|without) markup\b/i, why: "gated on #48: the pass-through family has no members" },
  { re: /\bsin (recargo|margen)\b/i, why: "gated on #48: the pass-through family has no members" },
  // The same claim without any of the words above — §3.4's suspended family-2
  // lead reads "Costs YeRide forwards without touching." / "…traslada sin tocar."
  { re: /\bforwards?\b[^.]{0,30}\bwithout touching\b/i, why: "gated on #48: pass-through claim without the words" },
  { re: /\btraslada\b[^.]{0,30}\bsin tocar\b/i, why: "gated on #48: pass-through claim without the words" },
  { re: /\binsurance\b/i, why: "gated on #48: YeRide carries no coverage" },
  { re: /\b(seguros?|aseguranza|p[óo]liza)\b/i, why: "gated on #48: YeRide carries no coverage" },
  { re: /\bcoverage\b/i, why: "gated on #48: YeRide carries no coverage" },
  { re: /\bcobertura\b/i, why: "gated on #48: YeRide carries no coverage" },

  // Never claimed, gate or no gate.
  { re: /\blocked\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bupfront (price|pricing)\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bprecio (fijo|cerrado|garantizado)\b/i, why: "never claimed: fares are metered, not locked" },
  // Spanish has ONE noun where English has two: "tarifa" is both the metered
  // fare and a charge, so "tarifas fijas" reads as fixed FARES on a metered
  // service, and "tarifa fija" is the taxi trade's own term for a flat,
  // meter-free price in this market (#75). Windowed, not adjacent, because
  // "la tarifa es fija" is the same claim; adjectives are feminine, which is
  // both correct agreement and what keeps "segundo plano" out. "acordada" and
  // "pactada" are deliberately absent, and so is EN "agreed": the Terms make
  // the honest DENIAL in exactly those words ("no se pactan de antemano" /
  // "not agreed in advance"), so gating them would fire on the copy the rule
  // exists to protect. There is no exemption for "tarifas de tecnología
  // fijas" — under § 5's vocabulary rule a YeRide charge is a "cargo", so the
  // qualified form is the wrong noun too, not a safe variant of it.
  {
    re: /\btarifas?\b[^.]{0,25}(?<![A-Za-zÀ-ÿ])(fija(?:da)?s?|planas?|cerradas?|garantizadas?|[úu]nicas?|preestablecidas?|predeterminadas?)\b/i,
    why: 'never claimed: a fare is metered, never fixed — and a YeRide charge is a "cargo", never a "tarifa"',
  },
  // The EN mirror, in both word orders so it covers what the ES pattern does.
  // English is safe by vocabulary — "fee" and "fare" are separate words and
  // this site keeps them apart — but that safety was assumed rather than
  // enforced, which is this map's recurring failure. "rate" and "price" are in
  // scope alongside "fare": on this site "rates" names the METER ("Published
  // rates — base, miles, minutes"), so "flat rate" is the same claim, not
  // innocent fee vocabulary.
  { re: /\b(flat|fixed|guaranteed)[- ]?(fares?|prices?|rates?)\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\b(fares?|prices?|rates?)\b[^.]{0,25}\b(flat|fixed|guaranteed)\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bno surprises\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bsin sorpresas\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bno surge\b(?![ \t]+today)/i, why: 'never claimed: only "no surge today" is permitted (§3.4)' },
  { re: /\bnunca\b[^.]{0,20}\brecargo\b/i, why: 'never claimed: only "no surge today" is permitted (§3.4)' },
  { re: /\bcheape(st|r)\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\blowest (fees|fares|price)\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\bm[áa]s barat[oa]s?\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\bm[áa]s econ[óo]mico\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\$[ \t]?\d/, why: "never claimed: no hard-coded money — every figure is fetched live" },
  { re: /\b\d[\d,.]*[ \t]*(dollars|USD)\b/i, why: "never claimed: no hard-coded money — every figure is fetched live" },
];
