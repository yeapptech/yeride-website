// /about and /es/about copy — VERBATIM from docs/copy-map.md §3.6 (wayfinder
// #85). Do not reword, re-case, or re-punctuate. §4's title and meta
// description sit on the page files, as they do everywhere.
//
// `identity` is the brand's own paragraph from `docs/identity.md` "Who we are",
// both languages authored (yeride-brand#22, `fe5be01`), with TWO SPANS OMITTED
// and nothing else touched — no rewriting, no resequencing, no translating.
// §3.6 writes out the exact surviving text and says the build takes it from
// there rather than from the brand doc, so this file quotes §3.6, not identity.md.
//
// The two omissions are not editorial. §5 fails the build on both, in both
// languages, because neither is true today:
//   - the fee sentence states the suspended pass-through family as fact —
//     YeRide carries no insurance and Stripe bills the driver's own connected
//     account directly (§3.4, #47). It returns when #48 lands.
//   - the origin sentence carries hard-coded money, which §5 admits nowhere on
//     this site (§0.4). Cut rather than pragma'd: a pragma buys a permanent
//     hole in the one rule keeping invented figures off the site, and the
//     origin beat is the one an About page can most afford to lose.
// What survives carries the promise, the name and the entity, plus the
// no-commission line, and reads as one paragraph without the other two.
//
// §3.6 sets the identity paragraph in markdown with a bold lead sentence and
// italicised word mentions. Those are the DOCUMENT's formatting, not copy: this
// site's copy modules are plain strings everywhere and nothing renders
// `set:html`, so the emphasis is dropped and the words are unchanged.
//
// `entity` restates the entity in fuller form than the paragraph's closing
// sentence — it is the only place Hernando Sierra survives, the origin sentence
// having been cut — and runs as a colophon at the foot of the page, four
// sections below the paragraph. §3.6 specifies both slots.
import type { Lang } from "./feesCopy";

export const aboutCopy = {
  en: {
    h1: "About YeRide",
    identity:
      'YeRide is a rideshare platform built in South Florida on a simple promise: drivers keep what they earn, and riders pay what the ride is worth. YeRide takes no commission. The name says the rest: "ye" is the old word for you. YeRide is your ride — whichever seat you\'re in. YeRide is built by YeAPP TECH LLC, a Florida software company.',
    missionH2: "Our mission",
    mission:
      "Make ridesharing fair: drivers keep what they earn, riders pay what the ride is worth.",
    valuesH2: "What we hold to",
    values: [
      "Transparency — every fee flat, published, and visible.",
      "Fairness to both sides — never grow one side's number by squeezing the other.",
      "Respect for the people doing the work — drivers are customers, not costs.",
      "Earn by efficiency, not extraction.",
    ],
    entity:
      "YeRide is built by YeAPP TECH LLC, a Florida software company founded by Hernando Sierra.",
  },
  es: {
    h1: "Sobre YeRide",
    identity:
      'YeRide es una plataforma de viajes hecha en el Sur de la Florida sobre una promesa sencilla: lo que el conductor gana es suyo, y el pasajero paga lo justo. YeRide no cobra comisión. El nombre dice el resto: "ye" es el you del inglés antiguo — el "tú" que se le dice a todos. YeRide es tu viaje — vayas en el asiento que vayas. YeRide la construye YeAPP TECH LLC, una compañía de software de la Florida.',
    missionH2: "Nuestra misión",
    mission:
      "Hacer justo el transporte compartido: que quien maneja se quede con lo que gana y quien viaja pague lo justo.",
    valuesH2: "En qué nos sostenemos",
    values: [
      "Transparencia — cada cargo fijo, publicado y a la vista.",
      "Justicia para ambos lados — nunca subir el número de un lado apretando al otro.",
      "Respeto por quien hace el trabajo — quien maneja es cliente, no un costo.",
      "Ganar por eficiencia, no por extracción.",
    ],
    entity:
      "YeRide es un producto de YeAPP TECH LLC, una empresa de software de la Florida fundada por Hernando Sierra.",
  },
} satisfies Record<Lang, unknown>;
