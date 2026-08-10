// /contact, /404 and /redirect copy — VERBATIM from docs/copy-map.md §3.7,
// §3.10 and §3.11 (wayfinder #34). Do not reword, re-case, or re-punctuate.
// §4's title and meta description sit on the page files, as they do everywhere.
//
// /404 and /redirect are ONE file each serving both languages (§3.10, §3.11):
// GitHub Pages serves a single root 404.html for every missing path, so /es/404
// is unreachable. Both language sets therefore ship in the same page and the
// switch happens client-side off `location.pathname` — which is why these two
// are the only copy objects on the site whose EN and ES halves are both in the
// shipped HTML at the same time.
import type { Lang } from "./feesCopy";

/** The render order for a bilingual page's halves. Shared by NotFoundPage and
 *  RedirectPage so the two cannot disagree about which languages ship. */
export const BILINGUAL_LANGS = ["en", "es"] as const satisfies readonly Lang[];

export const contactCopy = {
  en: {
    h1: "Contact us",
    lead: "Questions, problems, or something we got wrong — write to us.",
    emailLabel: "Email",
    email: "support@yeride.com",
    placeLabel: "Where we are",
    place: "Built in South Florida.",
  },
  es: {
    h1: "Contáctanos",
    lead: "Preguntas, problemas o algo que hicimos mal — escríbenos.",
    emailLabel: "Correo",
    email: "support@yeride.com",
    placeLabel: "Dónde estamos",
    place: "Hecho en el Sur de la Florida.",
  },
} satisfies Record<Lang, unknown>;

export const notFoundCopy = {
  en: {
    h1: "We can't find that page.",
    sub: "It may have moved, or the link may be wrong.",
    home: "Home",
    fees: "Fees",
    estimate: "Fare estimate",
  },
  es: {
    h1: "No encontramos esa página.",
    sub: "Puede que se haya movido o que el enlace esté mal.",
    home: "Inicio",
    fees: "Tarifas",
    estimate: "Estimar tarifa",
  },
} satisfies Record<Lang, unknown>;

export const redirectCopy = {
  en: {
    body: "Opening YeRide…",
    fallback: "Not redirected? Open YeRide.",
  },
  es: {
    body: "Abriendo YeRide…",
    fallback: "¿No abrió? Abre YeRide.",
  },
} satisfies Record<Lang, unknown>;

/**
 * The footer's copyright line (§1.2).
 *
 * Here because #88 forbids literal prose in an .astro text node and this was the
 * only one in the tree — `<p>© 2026 YeRide</p>` in Footer.astro. It gets no "it
 * is short" or "it is a mark" exemption: an exemption CATEGORY is exactly the
 * boundary judgement #79 chose the text-nodes-only rule to avoid.
 *
 * Not keyed by language, and that is the copy rather than an oversight — §1.2
 * gives one form for both, a symbol, a year and a name with nothing to translate.
 * The rest of Footer.astro's copy stays in its own frontmatter, untouched; #88
 * moved this line and only this line.
 *
 * THE YEAR IS THE CALLER'S, and that closes the rot #79 named and deliberately
 * left: it was hard-coded 2026 and would have been wrong from 2027-01-01, with
 * nothing to catch it. The caller passes the build's year, so the line is right
 * from the first deploy of any new year. The residue is narrower but real and is
 * stated rather than left to be found — this is a static build, so a year in
 * which the site is never deployed still shows the previous one. It is not taken
 * in the browser, because that would put script on every page of a zero-JS site
 * to render four characters.
 */
export const copyright = (year: number) => `© ${year} YeRide`;
