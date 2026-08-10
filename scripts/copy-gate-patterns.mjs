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

// § 5's locked-price rules match a noun and an adjective a few WORDS apart, not
// a fixed number of characters — "la tarifa es fija" is the claim as much as
// "tarifa fija" is. The gap is counted in words because the character distances
// that separate a claim from legitimate copy are far too close together to key
// on: "A flat, published price" (12 chars) is the claim and "flat published
// fees, and a rate card" (23 chars) is the shipped EN home meta. In words that
// is 1 against 4, which is a margin worth having.
//
// Neither may cross a sentence, and the EN gap is deliberately SHORT: a
// sentence-wide window fires on four live EN strings, the canonical driver
// pillar line among them ("Flat, published tech fees — never a percentage of
// the fare"). Run scripts/copy-gate-patterns.test.mjs before widening either.
// GAP and WORD must stay EXACT COMPLEMENTS of each other (bar the full stop,
// which is in neither, and is what keeps a match inside one sentence). They are
// nested quantifiers, so any character both classes accept gives the engine two
// ways to consume it and the backtracking goes exponential: an earlier revision
// had "-" in both and a 50 KB line hung the gate for minutes. Disjoint classes
// make it linear. If you add a character to one, remove it from the other.
const GAP = "[^A-Za-zÀ-ÿ0-9.]+"; // between two words, never across a full stop
const WORD = "[A-Za-zÀ-ÿ0-9]+";
const within = (n) => `(?:${GAP}${WORD}){0,${n}}${GAP}`;

// "Settled in advance" adjectives, agreeing with the noun they qualify.
// "acordada"/"pactada" ARE included: the Terms' honest denial uses the finite
// verb ("no se pactan de antemano"), never the participle, so there is no
// collision at any gap. EN "agreed" is NOT, and that is measured rather than
// assumed — the EN denial reads "rates for the service area, and they are not
// agreed in advance", which collides at sentence scope and clears the word gap
// by only three words. Too thin for the one sentence the rule exists to protect.
const ES_F = "fija(?:da)?s?|planas?|cerradas?|garantizadas?|acordadas?|pactadas?|preestablecidas?|predeterminadas?";
const ES_M = "fij(?:o|ado)s?|planos?|cerrados?|garantizados?|acordados?|pactados?|preestablecidos?|predeterminados?";
const EN_ADJ = "flat|fixed|guaranteed";
const EN_NOUN = "fares?|prices?|pricing|rates?";

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
  // Spanish has ONE noun where English has two: "tarifa" is both the metered
  // fare and a charge, so "tarifas fijas" reads as fixed FARES on a metered
  // service, and "tarifa fija" is the taxi trade's own term for a flat,
  // meter-free price in this market (#75). Both word orders, because
  // "Fijas y publicadas: las tarifas" is the same claim as "tarifas fijas".
  // There is no exemption for "tarifas de tecnología fijas" — under § 5's
  // vocabulary rule a YeRide charge is a "cargo", so the qualified form is the
  // wrong noun too, not a safe variant of it.
  {
    re: new RegExp(`\\btarifas?${within(5)}(${ES_F})\\b`, "i"),
    why: 'never claimed: a fare is metered, never fixed — and a YeRide charge is a "cargo", never a "tarifa"',
  },
  {
    re: new RegExp(`\\b(${ES_F})${within(5)}tarifas?\\b`, "i"),
    why: 'never claimed: a fare is metered, never fixed — and a YeRide charge is a "cargo", never a "tarifa"',
  },
  // "única" is ADJACENT-ONLY, alone among the adjectives. "tarifa única" is the
  // flat-fare claim, but "única" is also the ordinary word for *only*, so at any
  // gap at all it fires on legitimate copy: "Tarifas en la única zona donde
  // operamos." Catching the claim is not worth making that sentence unwritable.
  { re: /\btarifas?[ \t]+[úu]nicas?\b/i, why: 'never claimed: a fare is metered, never fixed — and a YeRide charge is a "cargo", never a "tarifa"' },
  // The sibling noun, same rule. "precio fijo" was already forbidden but only in
  // the singular and only adjacent, so "Precios fijos" and "El precio es fijo" —
  // the commonest ES wording of this very claim — both ran.
  { re: new RegExp(`\\bprecios?${within(5)}(${ES_M})\\b`, "i"), why: "never claimed: fares are metered, not locked" },
  { re: new RegExp(`\\b(${ES_M})${within(5)}precios?\\b`, "i"), why: "never claimed: fares are metered, not locked" },
  { re: /\bprecios?[ \t]+[úu]nicos?\b/i, why: "never claimed: fares are metered, not locked" },
  // The EN mirror. English is safe by vocabulary — "fee" and "fare" are
  // separate words and this site keeps them apart — but that safety was assumed
  // rather than enforced, which is this map's recurring failure. "rate" and
  // "price" are in scope alongside "fare": on this site "rates" names the METER
  // ("Published rates — base, miles, minutes"), so "flat rate" is the same
  // claim, not innocent fee vocabulary. Adjective-first gets the SHORT gap, and
  // that asymmetry is the whole reason the gap is measured: at three words it
  // would fail the build on the shipped home meta, "flat published fees, and a
  // rate card anyone can read".
  { re: new RegExp(`\\b(${EN_ADJ})${within(2)}(${EN_NOUN})\\b`, "i"), why: "never claimed: fares are metered, not locked" },
  { re: new RegExp(`\\b(${EN_NOUN})${within(5)}(${EN_ADJ})\\b`, "i"), why: "never claimed: fares are metered, not locked" },
  { re: /\bno surprises\b/i, why: "never claimed: fares are metered, not locked" },
  { re: /\bsin sorpresas\b/i, why: "never claimed: fares are metered, not locked" },
  // §5 permits ONE exception, and #82 moved it from a lookahead on the forbidden
  // phrase to a PERMITTED PHRASE of its own. A lookahead is a same-line,
  // same-bytes assertion, and both gates read normalised text only to ACCUSE:
  // pass 1's raw verdict is final and a view can only add hits, never withdraw
  // one. So the shipped "No surge today" (src/i18n/feesCopy.ts) passed by
  // accident — because it happens to sit on one line with a plain space. Write
  // "no surge&nbsp;today", let a formatter wrap the line, or bold the word
  // ("no surge <b>today</b>"), and the build failed on copy §3.4 expressly
  // permits, while every view could see it was permitted and none was asked.
  //
  // `permits` is that missing direction: a hit is WITHDRAWN when a
  // NON-FABRICATING view reads the permitted phrase over the same original
  // bytes. copy-gate-normalise.mjs's permissionsIn holds the three bounds that
  // keep a withdrawal from becoming a hole — read them before adding a second
  // `permits`, because this is the one field in this file that can make a gate
  // say less rather than more.
  //
  // The separator is [ \t]+ rather than \s+, and that is the same "never across
  // a sentence" discipline GAP keeps above. Every view collapses a wrapped
  // newline to a space and a PARAGRAPH break to a newline, so this excuses the
  // words either side of a line wrap and still accuses across a paragraph, where
  // a reader sees "No surge" standing alone as a claim.
  {
    re: /\bno surge\b/i,
    permits: /\bno surge[ \t]+today\b/i,
    why: 'never claimed: only "no surge today" is permitted (§3.4)',
  },
  { re: /\bnunca\b[^.]{0,20}\brecargo\b/i, why: 'never claimed: only "no surge today" is permitted (§3.4)' },
  { re: /\bcheape(st|r)\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\blowest (fees|fares|price)\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\bm[áa]s barat[oa]s?\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\bm[áa]s econ[óo]mico\b/i, why: "never claimed: no price-leadership claim" },
  { re: /\$[ \t]?\d/, why: "never claimed: no hard-coded money — every figure is fetched live" },
  { re: /\b\d[\d,.]*[ \t]*(dollars|USD)\b/i, why: "never claimed: no hard-coded money — every figure is fetched live" },
];
