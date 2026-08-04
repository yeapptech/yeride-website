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
import { PATTERNS } from "./copy-gate-patterns.mjs";

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
  ["Stripe's rate ES", "La tarifa estándar de las redes de tarjetas, que paga quien maneja en viajes con tarjeta. Los viajes en efectivo no la tienen."],
  ["Terms encode the distinction", "Cada tarifa que YeRide mide y cada cargo que aplica están publicados en el tarifario, en www.yeride.com/es/fees."],
  ["fare estimate lead", "De dónde a dónde. Te mostramos lo que costaría el viaje con las tarifas de hoy."],
  ["service area note", "Todo estimado aquí usa las tarifas de esta área, incluso para una ruta fuera de ella — un precio no significa que YeRide opere allí."],
  ["Stripe, ni lo fija", "En los viajes con tarjeta, Stripe le cobra su cargo de procesamiento directamente a la cuenta de quien maneja. YeRide nunca lo toca ni lo fija."],
  // EN meter/fee vocabulary, and "flat" as a rule-kind identifier
  ["EN published rates", "Published rates — base, miles, minutes. The fare follows the ride."],
  ["EN today's rates", "Example at today’s rates"],
  ["EN loading rates", "Loading current rates…"],
  ["EN Stripe's rate", "The card networks' standard rate, borne by the driver on card fares. Cash fares have none."],
  ["EN estimate note", "Every estimate here uses this area's rates, even for a route outside it — a price is not a promise that YeRide operates there."],
  ["EN rule kind", 'case "flat": {'],
  ["EN type member", '| { kind: "flat"; amount: number }'],
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
const check = (label, list, wantMatch) => {
  for (const [name, s] of list) {
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
  const t0 = process.hrtime.bigint();
  PATTERNS.forEach((p) => p.re.test(s));
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  if (ms > BUDGET_MS) {
    console.log(`FAIL  backtracking — case ${i} (len ${s.length}) took ${ms.toFixed(0)}ms, budget ${BUDGET_MS}ms.`);
    console.log(`      GAP and WORD have almost certainly stopped being disjoint.`);
    failures++;
  }
}

const total = FORBIDDEN.length + ALLOWED.length + PATHOLOGICAL.length;
console.log(`${failures ? "✗" : "✓"} copy-gate patterns: ${total} controls, ${failures} failure${failures === 1 ? "" : "s"}`);
process.exit(failures ? 1 : 0);
