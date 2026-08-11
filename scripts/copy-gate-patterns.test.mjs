// Controls for the copy-gate pattern list. Plain node, no runner, no deps:
//
//     node scripts/copy-gate-patterns.test.mjs
//
// This file exists because "verified with N controls" is worth nothing if the
// controls are not in the repo. Wayfinder #75 added it after a review found its
// locked-price patterns were the examples rather than the class, twice running.
//
// It lives in scripts/, which neither gate scans, so the forbidden phrases below
// are safe to write down. That is also why they must stay here and never move
// into src/ or public/.
//
// THE HARD PART IS THE SECOND LIST. A locked-price pattern is easy to widen and
// easy to widen too far: "única" is both a flat-fare adjective and the ordinary
// word for *only*, and English says "flat published fees, and a rate card" in
// copy that is entirely correct. Every entry under "must not fire" is real copy
// from this site or a real Spanish sentence someone could reasonably write. Add
// to it before widening anything.
//
// A THIRD AND FOURTH LIST arrived with #82, and they are about the one field in
// the pattern list that can make a gate say LESS: `permits`. See the bottom of
// this file — and note that they run the real reading machine and then the real
// gate, not `re.test`, because a withdrawal is a property of the machine.
import { fileURLToPath } from "node:url";

import { runGate } from "./copy-gate-fixture.mjs";
import { PATTERNS } from "./copy-gate-patterns.mjs";
import { countOccurrences, isPermitted, matchesIn, permissionsIn, viewsOf } from "./copy-gate-normalise.mjs";

const matches = (s) => PATTERNS.filter((p) => p.re.test(s));

// ---------------------------------------------------------------- must fire
const FORBIDDEN = [
  // the three strings that actually shipped, pre-#75
  ["ES meta as shipped", "Transporte compartido hecho en el Sur de la Florida. Sin comisión, tarifas fijas y publicadas, y un tarifario que cualquiera puede leer."],
  ["ES fact strip as shipped", "Tarifas fijas y publicadas."],
  ["ES feeH3 as shipped", "Tarifas fijas y publicadas. Sin comisión."],
  // the ES adjective class, noun first
  ["fija", "Una tarifa fija al aeropuerto."],
  ["fijas", "tarifas fijas"],
  ["fijada", "tarifa fijada"],
  ["plana", "tarifa plana"],
  ["cerrada", "tarifa cerrada"],
  ["garantizadas", "tarifas garantizadas"],
  ["acordada", "tarifa acordada de antemano"],
  ["pactada", "una tarifa pactada"],
  ["preestablecida", "tarifa preestablecida"],
  ["predeterminada", "tarifa predeterminada"],
  ["única, adjacent", "tarifa única"],
  ["únicas, adjacent", "tarifas únicas"],
  // gap forms — the review's "adjacency was the examples, not the class"
  ["copula", "La tarifa es fija."],
  ["adverb between", "tarifa siempre fija"],
  ["reordered qualifier", "Tarifas de tecnología publicadas y fijas."],
  ["qualified form is not exempt", "tarifas de tecnología fijas y publicadas"],
  // ES adjective first
  ["ES adj first", "Fijas y publicadas: las tarifas de YeRide"],
  ["ES adj first, adjacent", "fijas las tarifas"],
  // the sibling noun — pre-#75 this was singular and adjacent only
  ["precios plural", "Precios fijos en todos los viajes."],
  ["precio copula", "El precio es fijo."],
  ["precio cerrado", "precio cerrado"],
  ["precio único", "precio único"],
  ["precio adj first", "Fijos y publicados: los precios de YeRide"],
  // every adjective, masculine and feminine, singular and plural — an earlier
  // revision wrote the masculine as "fijo(?:s|dos?)?", which missed "fijado"
  // entirely and matched the nonsense "fijodo".
  ["precio fijado", "precio fijado de antemano"],
  ["precios fijados", "precios fijados"],
  ["tarifas fijadas", "tarifas fijadas"],
  ["precio garantizado", "precio garantizado"],
  ["precio pactado", "precio pactado"],
  ["precio acordado", "precio acordado"],
  ["precio preestablecido", "precio preestablecido"],
  ["precio predeterminado", "precio predeterminado"],
  ["precio plano", "precio plano"],
  // EN, adjective first
  ["EN flat fare", "A flat fare to the airport."],
  ["EN fixed fare", "Your fixed fare."],
  ["EN guaranteed fare", "a guaranteed fare"],
  ["EN flat rate", "a flat rate to the airport"],
  ["EN flat price", "flat price"],
  ["EN fixed price", "fixed price"],
  ["EN flat pricing", "Flat pricing on every trip."],
  ["EN hyphenated", "flat-fare service"],
  ["EN one word between", "A flat, published price for every ride."],
  // EN, noun first
  ["EN copula", "The fare is fixed."],
  ["EN copula plural", "Prices are flat."],
  ["EN rate is fixed", "The rate is fixed before you ride."],
  ["EN case insensitive", "Flat Fare"],
  // The bare surge claim. §3.4 permits "no surge TODAY" and nothing wider; the
  // unqualified form is the claim the permitted phrase is carved out of, so it
  // belongs here rather than being implied by the exception's own controls below.
  ["EN bare surge claim", "No surge, ever."],
  ["EN surge claim mid-sentence", "Flat fees and no surge."],
  // The cash bar (#111). Every entry down to the "not written by anyone" group
  // is a string that WAS LIVE IN PRODUCTION — the five #111 struck plus the two
  // #107 struck before it — so this list is the record of what shipped, not a
  // set of examples. The gate could not carry them until the copy was gone, and
  // that is why the removal and these patterns are one commit.
  ["EN home fact 3, as shipped", "Card or cash."],
  ["ES home fact 3, as shipped", "Tarjeta o efectivo."],
  ["EN /riders meta, as shipped", "Published rates — base, miles, minutes. The same math every trip, and every fee published. Card or cash."],
  ["ES /riders meta, as shipped", "Tarifas publicadas — base, millas, minutos. Las mismas cuentas en cada viaje y cada cargo publicado. Tarjeta o efectivo."],
  ["EN terms §4, as shipped", "You can pay by card or in cash."],
  ["ES terms §4, as shipped", "Usted puede pagar con tarjeta o en efectivo."],
  ["EN terms §4 second block, as shipped", "Cash is handed to the driver directly; YeRide is not part of that exchange beyond recording that the ride was paid in cash."],
  ["ES terms §4 second block, as shipped", "El efectivo se le entrega directamente al conductor; YeRide no participa en ese intercambio más allá de registrar que el viaje se pagó en efectivo."],
  ["EN /fees line struck by #107", "Cash fares have none."],
  ["ES /fees line struck by #107", "Los viajes en efectivo no la tienen."],
  ["EN /fees footnote struck by #107", "On a cash fare there’s no card processing — the driver keeps "],
  ["ES /fees footnote struck by #107", "En un viaje en efectivo no hay procesamiento de tarjeta — a quien maneja le quedan "],
  // Wordings NOBODY WROTE. This is the half a conjunction-only rule would miss,
  // and the reason the bare word is in the list at all: the enumeration failure
  // is this map's recurring one, and a bar that only knows the phrasings someone
  // happened to use is not a bar.
  ["EN unwritten — accept", "We accept cash."],
  ["EN unwritten — welcome", "Cash welcome on every ride."],
  ["EN unwritten — reversed conjunction", "Cash or card, your choice."],
  ["EN unwritten — 'in cash or by card'", "Pay in cash or by card."],
  ["ES unwritten — aceptamos", "Aceptamos efectivo."],
  ["ES unwritten — imperative", "Paga en efectivo si prefieres."],
  ["ES unwritten — reversed conjunction", "Efectivo o tarjeta, como prefieras."],
  ["ES unwritten — 'efectivo o con tarjeta'", "Puedes pagar en efectivo o con tarjeta."],
];

// ------------------------------------------------------------ must NOT fire
const ALLOWED = [
  // what #75 shipped
  ["ES meta", "Transporte compartido hecho en el Sur de la Florida. Sin comisión, cargos fijos y publicados, y un tarifario que cualquiera puede leer."],
  ["ES fact strip", "Cargos fijos y publicados."],
  ["ES feeH3", "Cargos fijos y publicados. Sin comisión."],
  ["ES home driver support", "Sin comisión. Cargos de tecnología fijos y publicados — nunca un porcentaje de la tarifa."],
  ["ES drivers support", "YeRide no cobra comisión. Pagas cargos de tecnología fijos y publicados — nunca un porcentaje de la tarifa. Sin suscripciones, sin cargos escondidos."],
  ["ES drivers meta", "Sin comisión — los cargos de YeRide son fijos, publicados y nunca un porcentaje de la tarifa. Usa YeRide junto a Uber y Lyft."],
  // THE LIVE EN COPY. A sentence-wide EN gap fires on all four of these.
  ["EN home driver support", "No commission. Flat, published tech fees — never a percentage of the fare."],
  ["EN drivers support", "YeRide takes no commission. You pay flat, published tech fees — never a percentage of the fare. No subscriptions, no hidden fees."],
  ["EN home meta", "Rideshare built in South Florida. No commission, flat published fees, and a rate card anyone can read."],
  ["EN drivers meta", "No commission — YeRide's fees are flat, published, and never a percentage of the fare."],
  ["EN fees family lead", "Flat, per-trip, published. This is how YeRide earns — never a percentage of the fare."],
  ["EN fact strip", "Flat, published fees."],
  // the Terms' honest denials — the copy these rules exist to protect
  ["ES Terms denial", "Las tarifas se miden con taxímetro. Se calculan a partir de las tarifas publicadas de base, distancia y tiempo del área de servicio, y no se pactan de antemano. El estimado de este sitio es un estimado: el taxímetro decide."],
  ["EN Terms denial", "Fares are metered. They are calculated from the published base, distance and time rates for the service area, and they are not agreed in advance. The estimate on this website is an estimate — the meter decides."],
  // "única"/"único" meaning ONLY — the false positive that forced adjacency
  ["única = only, with tarifas", "Tarifas en la única zona donde operamos."],
  ["única = only, longer", "Las tarifas de la única área de servicio que cubrimos."],
  ["única = only, adj first", "La única tarifa que cobramos es la del taxímetro."],
  ["único = only, with precio", "El precio en el único mercado donde operamos."],
  ["únicamente is not única", "únicamente lo que su parte requiere:"],
  // accent and word-boundary traps
  ["segundo plano", "en segundo plano, no solo mientras usted mira la pantalla"],
  // the nonsense the broken masculine alternation used to accept
  ["not a word", "precio fijodo"],
  // tarifa used legitimately — the meter, the rate card
  ["hero sub", "Tarifas publicadas — base, millas, minutos. El precio sigue al viaje."],
  ["riders pillar 2", "Tarifas publicadas — base, millas, minutos. El precio sigue al viaje, no lo que la app cree que puedes pagar."],
  ["minimum fare", "Tarifa mínima"],
  ["meter fare", "Tarifa del taxímetro"],
  ["percent of fare", "de la tarifa"],
  ["today's rates", "Ejemplo con las tarifas de hoy"],
  ["loading", "Cargando las tarifas actuales…"],
  ["Stripe's rate ES", "La tarifa estándar de las redes de tarjetas, que paga quien maneja en viajes con tarjeta."],
  ["Terms encode the distinction", "Cada tarifa que YeRide mide y cada cargo que aplica están publicados en el tarifario, en www.yeride.com/es/fees."],
  ["fare estimate lead", "De dónde a dónde. Te mostramos lo que costaría el viaje con las tarifas de hoy."],
  ["service area note", "Todo estimado aquí usa las tarifas de esta área, incluso para una ruta fuera de ella — un precio no significa que YeRide opere allí."],
  ["Stripe, ni lo fija", "En los viajes con tarjeta, Stripe le cobra su cargo de procesamiento directamente a la cuenta de quien maneja. YeRide nunca lo toca ni lo fija."],
  // EN meter/fee vocabulary, and "flat" as a rule-kind identifier
  ["EN published rates", "Published rates — base, miles, minutes. The fare follows the ride."],
  ["EN today's rates", "Example at today’s rates"],
  ["EN loading rates", "Loading current rates…"],
  ["EN Stripe's rate", "The card networks' standard rate, borne by the driver on card fares."],
  ["EN estimate note", "Every estimate here uses this area's rates, even for a route outside it — a price is not a promise that YeRide operates there."],
  ["EN rule kind", 'case "flat": {'],
  ["EN type member", '| { kind: "flat"; amount: number }'],
  // CARD copy, which the cash bar must leave entirely alone (#111). Card is the
  // one payment method the product implements, so every line here is live and
  // correct; a cash pattern that reached any of them would be barring the truth
  // in order to bar a falsehood. "card fare" and "viaje con tarjeta" are the
  // closest calls, being a payment word beside a fare word.
  ["EN Stripe body", "On card fares, Stripe charges its processing fee directly to the driver’s own account. YeRide never touches it and doesn’t set it."],
  ["EN Stripe H2", "Card processing is Stripe’s, not YeRide’s"],
  ["EN driver total, card", "Total — card fare"],
  ["EN driver total, before card", "Total — before card processing"],
  ["EN terms §4 as it now reads", "You pay by card."],
  ["EN terms §4 Stripe block", "Card payments are processed by Stripe, and paying by card means accepting Stripe's terms as well as these."],
  ["EN privacy card details", "Payment — card details are entered into Stripe, not into YeRide, and we never see or store a card number."],
  ["ES Stripe H2", "El procesamiento de tarjeta es de Stripe, no de YeRide"],
  ["ES driver total, card", "Total — viaje con tarjeta"],
  ["ES driver total, before card", "Total — antes del procesamiento de tarjeta"],
  ["ES terms §4 as it now reads", "Usted paga con tarjeta."],
  ["ES terms §4 Stripe block", "Los pagos con tarjeta los procesa Stripe, y pagar con tarjeta implica aceptar también los términos de Stripe."],
];

// ------------------------------------------------------- catastrophic backtracking
// The windowed patterns are nested quantifiers. When GAP and WORD overlapped by a
// single character ("-" was in both), these inputs hung the gate for minutes —
// which means a long minified line in dist/ could hang the build. Disjoint classes
// make it linear. This control is the reason to keep them that way.
const PATHOLOGICAL = [
  "tarifa " + "a ".repeat(5000),
  "tarifa" + "  -  ".repeat(4000) + "!",
  "price" + " x".repeat(6000),
  "flat" + ",".repeat(20000),
  "tarifa" + " ".repeat(50000),
  "precio " + "- ".repeat(10000) + "z",
  "tarifa" + " -".repeat(25000) + " fij",
];
const BUDGET_MS = 250;

let failures = 0;
let checks = 0;
// The total is COUNTED, not written down — copy-gate-files.test.mjs's rule, and
// it binds harder here: several of the controls below are loops, so a hand-kept
// total is one edit away from claiming coverage that was deleted.
const say = (ok, label, detail) => {
  checks++;
  if (ok) return;
  console.log(`FAIL  ${label}${detail ? `\n      ${detail}` : ""}`);
  failures++;
};
const check = (label, list, wantMatch) => {
  for (const [name, s] of list) {
    checks++;
    const hit = matches(s);
    if (wantMatch && hit.length === 0) {
      console.log(`FAIL  ${label} — nothing matched: ${name}\n      ${s}`);
      failures++;
    } else if (!wantMatch && hit.length > 0) {
      console.log(`FAIL  ${label} — false positive: ${name}\n      ${s}\n      matched: ${hit.map((p) => p.re.source).join("\n               ")}`);
      failures++;
    }
  }
};
check("forbidden", FORBIDDEN, true);
check("legitimate", ALLOWED, false);

for (const [i, s] of PATHOLOGICAL.entries()) {
  checks++;
  const t0 = process.hrtime.bigint();
  PATTERNS.forEach((p) => p.re.test(s));
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  if (ms > BUDGET_MS) {
    console.log(`FAIL  backtracking — case ${i} (len ${s.length}) took ${ms.toFixed(0)}ms, budget ${BUDGET_MS}ms.`);
    console.log(`      GAP and WORD have almost certainly stopped being disjoint.`);
    failures++;
  }
}

// ------------------------------------------- §5's permitted exception (#82)
//
// TWO MORE LAYERS, for the same reason copy-gate-suspension.test.mjs has two: the
// reader being right is not the claim. `permits` is the only thing in either gate
// that turns a failure into a pass, so it is proved through the real reading
// machine first, and then through check-copy-gate.mjs itself.
//
// What #82 was filed over: "no surge today" is copy §3.4 expressly permits, and
// it was expressed as a negative lookahead on the forbidden pattern. Both gates
// read normalised text only to ACCUSE, so the lookahead was a same-line,
// same-bytes assertion — splitting the permitted phrase with an &nbsp;, a line
// wrap, or a <b> failed the build on permitted copy, while every view could see
// it was permitted and none was asked.

// ---- layer 1: the reading machine. Accusations left standing after withdrawal.
const accusations = (text, { markup = false, includeFabricating = false } = {}) => {
  const views = viewsOf(text, { markup, includeFabricating });
  const permissions = permissionsIn(views, PATTERNS);
  return matchesIn(views, PATTERNS).filter((m) => !isPermitted(permissions, m.at, m.offsets));
};

// Withdrawn: every split this normaliser exists to see through. The first is the
// copy as it ships today; the rest are the edits #82 says nobody would think
// twice about.
const PERMITTED = [
  ["as shipped, one line", `  surgeH2: "No surge today",`, {}],
  ["non-breaking space", "<h2>No surge&nbsp;today</h2>", { markup: true }],
  ["the legacy no-semicolon form", "<h2>No surge&nbsptoday</h2>", { markup: true }],
  ["wrapped by a formatter", "<h2>\n  No surge\n  today\n</h2>", { markup: true }],
  ["the word bolded", "<h2>No surge <b>today</b></h2>", { markup: true }],
  ["a JS escape in the bundle", `const h = "No surge \\u0074oday";`, {}],
  // The permitted phrase with a gap of its OWN. isPermitted compares the bytes
  // each side was read from, and both sides drop bytes — here the accusation
  // comes from a view that removed the tag from the middle of the claim, and
  // comparing outer ranges would leave this accused.
  ["the claim itself split by a tag", "<h2>No <b>surge</b> today</h2>", { markup: true }],
  // §5's SECOND and THIRD permitted phrases, added by #111: the privacy policy's
  // Payment paragraph, in both languages. It is a CONDITIONAL describing what
  // YeRide would store in a case that cannot arise, not an offer of a payment
  // method, so the bar does not reach it — and `permits` was chosen over a
  // per-line pragma because that paragraph SHIPS: pragmas are stripped by the
  // build, so a pragma would have left the dist gate needing a hand-blessed
  // entry keyed to an exact occurrence count inside a legal document.
  ["EN privacy conditional, as shipped", `"a rider pays cash, the fare passes from rider to driver in person; "`, {}],
  ["ES privacy conditional, as shipped", `"un pasajero paga en efectivo, la tarifa va del pasajero al conductor "`, {}],
  ["EN privacy conditional, word emphasised", "<p>When a rider pays <b>cash</b>, the fare passes.</p>", { markup: true }],
  ["EN privacy conditional, wrapped by a formatter", "<p>When a rider\n  pays cash, the fare passes.</p>", { markup: true }],
  ["ES privacy conditional, non-breaking space", "<p>Cuando un pasajero paga en&nbsp;efectivo, la tarifa va.</p>", { markup: true }],
];

// Still accused. Each is a bound from permissionsIn or isPermitted, written as
// the copy that would slip through if the bound were dropped.
const STILL_ACCUSED = [
  ["the bare claim", "<h2>No surge, ever.</h2>", { markup: true }, 1],
  // Every view collapses a paragraph break to a newline, not to a space, so the
  // permitted phrase does not span one — a reader sees "No surge" standing alone.
  ["across a paragraph break", "No surge\n\ntoday is different.", {}, 1],
  // isPermitted's overlap bound: a permitted phrase elsewhere in the file must not
  // excuse a bare claim here. Two occurrences, one excused, exactly one left.
  ["a permitted phrase does not excuse a second, bare one", `const a = "No surge today";\nconst b = "No surge, ever.";`, {}, 1],
  // permissionsIn's fabrication bound, and the reason it is not decorative: under
  // "tags-as-space" this reads as the permitted phrase, and to a reader it reads
  // "No surgetoday". A view that can invent a phrase may accuse, never excuse.
  ["a fabricating view cannot excuse", "<p>No surge<i></i>today</p>", { markup: true, includeFabricating: true }, 1],
  // THE SPAN-SWALLOW BYPASS, found by an independent review of the first revision
  // of this fix and green in both gates at the time. Under "tags-removed" this
  // reads as the permitted phrase, and the OUTER SPAN of that reading covers the
  // markup the view dropped — including a never-claimed §5 string a browser puts
  // on screen as alt text. isPermitted compares the bytes the permitted phrase was
  // read FROM, so the alt is not among them.
  //
  // Two claims here, and only the visible one is excused: the alt is what must
  // survive. Widen this back to a span and the count goes to 0, not to 1.
  [
    "a claim inside the markup the permitted phrase spans",
    `<p>no surge <img src="/a.png" alt="no surge, ever" /> today</p>`,
    { markup: true },
    1,
  ],
  // The same shape without the tags, so the bound is not read as a markup-only
  // concern: whitespace collapse and reference decoding drop bytes too.
  [
    "a claim inside a reference run the permitted phrase spans",
    `const a = "No surge&nbsp;today";\nconst b = "no surge, ever.";`,
    { markup: true },
    1,
  ],
  // THE CASH BAR'S TWO LAYERS (#111), and this group is the whole argument for
  // there being two. The bare word carries a `permits`; the conjunction does not.
  //
  // First, the canonical barred line itself must be accused. It is matched by
  // both layers — the conjunction and the bare word — and the two spans overlap,
  // so countOccurrences reports ONE claim, not two.
  ["the canonical barred line", "<p>Card or cash.</p>", { markup: true }, 1],
  ["the ES canonical barred line", "<p>Tarjeta o efectivo.</p>", { markup: true }, 1],
  // Then the laundering shape, which is the reason the conjunction layer exists.
  // `permits` withdraws over OVERLAPPING BYTES, so the permitted phrase sits
  // directly on top of the barred one here and the bare-word hit IS withdrawn.
  // Delete the conjunction patterns and this sentence — an offer of two payment
  // methods, in a document a reader relies on — passes both gates silently.
  ["a permitted phrase cannot launder an offer built on top of it", "When a rider pays cash or card, the fare passes.", {}, 1],
  ["the ES laundering shape", "Cuando un pasajero paga en efectivo o con tarjeta, la tarifa va.", {}, 1],
  // isPermitted's overlap bound, on the new permissions: the privacy sentence
  // must excuse its own bytes and nothing else in the file.
  [
    "the privacy permit does not excuse a bare cash claim elsewhere",
    `const a = "When a rider pays cash, the fare passes.";\nconst b = "We accept cash.";`,
    {},
    1,
  ],
  [
    "the ES privacy permit does not excuse a bare claim elsewhere",
    `const a = "Cuando un pasajero paga en efectivo, la tarifa va.";\nconst b = "Aceptamos efectivo.";`,
    {},
    1,
  ],
];

for (const [name, text, opts] of PERMITTED) {
  const left = accusations(text, opts);
  say(
    left.length === 0,
    `permitted — ${name}`,
    `${text.replace(/\n/g, "\\n")}\n      still accused: ${left.map((m) => `"${m.text}" [${m.view}]`).join(", ")}`,
  );
}
for (const [name, text, opts, want] of STILL_ACCUSED) {
  const left = accusations(text, opts);
  // Counted as the dist gate counts: overlapping spans from different views are
  // ONE claim seen several times. Counting raw matches instead would make these
  // controls assert the number of views, which is not the fact under test.
  const got = countOccurrences(left.map((m) => m.span));
  say(
    got === want,
    `still accused — ${name}`,
    `${text.replace(/\n/g, "\\n")}\n      expected ${want} claim(s), got ${got}`,
  );
}

// ---- layer 2: the gate itself, spawned over a temporary fixture tree.
// This is what a unit control cannot reach: between the reading machine and the
// verdict sit pass 1's raw line matcher — which is where the permitted phrase is
// actually split — the comment-stripping pass, and the import wiring. Deleting
// `isPermitted` from pass 1 alone leaves every layer-1 control green.
//
// The gate walks ROOTS = ["src", "public"] relative to its working directory, so
// a temp tree with those two directories is a complete world to it. Never the
// real tree: the real tree's own green run, one step later in `npm run checks`,
// is what asserts the shipped "No surge today" still passes.
const GATE = fileURLToPath(new URL("./check-copy-gate.mjs", import.meta.url));

// The source gate walks src/ and public/ and throws if either is missing, so
// every fixture gets both. A .nojekyll carries no copy and is not scanned.
const src = (files) => runGate(GATE, { "public/.nojekyll": "", ...files });

// The three splits from #82's own report, through the gate, in the file types
// each would really be written in.
for (const [name, files] of [
  ["as shipped", { "src/i18n/feesCopy.ts": `export const c = {\n  surgeH2: "No surge today",\n};\n` }],
  ["non-breaking space", { "src/components/Fees.astro": `<h2>No surge&nbsp;today</h2>\n` }],
  ["wrapped by a formatter", { "src/components/Fees.astro": `<h2>\n  No surge\n  today\n</h2>\n` }],
  ["the word bolded", { "src/components/Fees.astro": `<h2>No surge <b>today</b></h2>\n` }],
]) {
  const { code, out } = src(files);
  say(code === 0, `the GATE must pass — permitted, ${name}`, out.trim());
}

// The negative control. Without it the four above are satisfied by a gate that
// has stopped reading this pattern at all — which is precisely what a lookahead
// widened "just a little" would produce.
{
  const { code, out } = src({ "src/components/Fees.astro": `<h2>No surge, ever.</h2>\n` });
  say(
    code === 1 && /no surge/i.test(out),
    "the GATE must still fail — the bare claim",
    out.trim(),
  );
}
{
  const { code, out } = src({
    "src/i18n/feesCopy.ts": `export const c = {\n  a: "No surge today",\n  b: "No surge, ever.",\n};\n`,
  });
  say(
    code === 1 && /:3\b/.test(out),
    "the GATE must still fail — a permitted phrase does not excuse a bare one on another line",
    out.trim(),
  );
}

// The cash bar through the real gate (#111). Same reason as the surge controls
// above: `permits` is honoured by pass 1's raw line matcher, the comment-stripping
// pass and the import wiring, none of which layer 1 can reach.
{
  const { code, out } = src({
    "src/i18n/legalCopy.ts": `export const c = {\n  a: "When a rider pays cash, the fare passes from rider to driver in person.",\n  b: "Cuando un pasajero paga en efectivo, la tarifa va del pasajero al conductor en persona.",\n};\n`,
  });
  say(code === 0, "the GATE must pass — the privacy conditional, both languages", out.trim());
}
for (const [name, files] of [
  ["EN canonical barred line", { "src/i18n/homeCopy.ts": `export const c = { facts: ["Card or cash."] };\n` }],
  ["ES canonical barred line", { "src/i18n/homeCopy.ts": `export const c = { facts: ["Tarjeta o efectivo."] };\n` }],
  ["a wording nobody wrote", { "src/components/Riders.astro": `<p>We accept cash.</p>\n` }],
]) {
  const { code, out } = src(files);
  say(code === 1 && /(cash|efectivo)/i.test(out), `the GATE must fail — ${name}`, out.trim());
}
// The laundering shape, through the gate. This is the control that would go green
// if someone "simplified" the two layers down to the bare word alone.
{
  const { code, out } = src({
    "src/i18n/legalCopy.ts": `export const c = {\n  a: "When a rider pays cash or card, the fare passes.",\n};\n`,
  });
  say(
    code === 1 && /cash or card/i.test(out),
    "the GATE must fail — an offer built on top of the permitted phrase",
    out.trim(),
  );
}

// ---- layer 3: the DIST gate, over a fixture dist/ tree.
// Both gates import the same pattern list and the same normaliser, but each
// calls isPermitted itself, so "the source gate withdraws" is not evidence that
// the shipped-output gate does — that inference is the one #83 was filed over.
// It matters more here, not less: this gate takes the two views that can invent
// a phrase, so it is where a fabricated "permission" would be laundered.
//
// Asserted on the surge line rather than on the exit code, and the weakness is
// stated rather than hidden: a fixture dist/ cannot carry the real build's files,
// so this gate's ALLOWED entries all report "no longer appears" and it exits 1
// whatever the surge verdict. The bare-claim control below is what stops "no
// surge line" from being satisfied by a gate that has stopped reading at all.
const DIST_GATE = fileURLToPath(new URL("./check-dist-copy-gate.mjs", import.meta.url));

const surgeVerdict = (html) =>
  runGate(DIST_GATE, { "dist/fees/index.html": html })
    .out.split("\n")
    .filter((line) => /"no surge/i.test(line));

for (const [name, html] of [
  ["as shipped", "<h2>No surge today</h2>\n"],
  ["non-breaking space", "<h2>No surge&nbsp;today</h2>\n"],
  ["the word bolded", "<h2>No surge <b>today</b></h2>\n"],
  ["wrapped by a formatter", "<h2>\n  No surge\n  today\n</h2>\n"],
]) {
  const lines = surgeVerdict(html);
  say(lines.length === 0, `the DIST gate must not report — permitted, ${name}`, lines.join("\n      "));
}
{
  const lines = surgeVerdict("<h2>No surge, ever.</h2>\n");
  say(lines.length === 1, "the DIST gate must still report — the bare claim", lines.join("\n      "));
}
// The laundering shape the fabrication bound exists to refuse. Under
// "tags-as-space" — a view only this gate takes — the bytes read as the permitted
// phrase; a reader sees "No surgetoday". The permission must not be granted.
{
  const lines = surgeVerdict("<h2>No surge<i></i>today</h2>\n");
  say(
    lines.length === 1,
    "the DIST gate must still report — a fabricating view cannot excuse",
    lines.join("\n      "),
  );
}

// The cash bar through the DIST gate (#111). Same reason again, and it bites
// harder here: the privacy policy is SHIPPED, so this gate — not the source gate —
// is the one that reads the permitted conditional out of real page HTML, through
// the two views that can invent a phrase and may therefore accuse but never excuse.
const cashVerdict = (html) =>
  runGate(DIST_GATE, { "dist/privacy-policy/index.html": html })
    .out.split("\n")
    .filter((line) => /"[^"]*(cash|efectivo)/i.test(line));

for (const [name, html] of [
  ["EN privacy conditional", "<p>When a rider pays cash, the fare passes from rider to driver in person.</p>\n"],
  ["ES privacy conditional", "<p>Cuando un pasajero paga en efectivo, la tarifa va del pasajero al conductor en persona.</p>\n"],
  ["EN privacy conditional, word emphasised", "<p>When a rider pays <b>cash</b>, the fare passes.</p>\n"],
]) {
  const lines = cashVerdict(html);
  say(lines.length === 0, `the DIST gate must not report — permitted, ${name}`, lines.join("\n      "));
}
for (const [name, html] of [
  ["the canonical barred line", "<p>Card or cash.</p>\n"],
  ["the ES canonical barred line", "<p>Tarjeta o efectivo.</p>\n"],
  ["an offer built on top of the permitted phrase", "<p>When a rider pays cash or card, the fare passes.</p>\n"],
  // Composed by the build out of parts innocent in the source — the one residual
  // only this gate can see, and the shape a PR author hits by accident.
  ["a claim welded together by the build", "<p>Card or<!-- --> cash.</p>\n"],
]) {
  const lines = cashVerdict(html);
  say(lines.length >= 1, `the DIST gate must report — ${name}`, lines.join("\n      "));
}

console.log(`${failures ? "✗" : "✓"} copy-gate patterns: ${checks} controls, ${failures} failure${failures === 1 ? "" : "s"}`);
process.exit(failures ? 1 : 0);
