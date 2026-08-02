// EN/ES route parity — every route ships in both languages, or the build fails.
// Wayfinder #41; rules from docs/copy-map.md §6.1.
//
// Dumb on purpose: it reads filenames under src/pages and nothing else.

import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const PAGES = "src/pages";
const PAGE_EXT = /\.(astro|md|mdx|html)$/;

// Exempt by name: both are single-file by design and switch language
// client-side (copy-map §3.10, §3.11), so neither has — or wants — an /es/ twin.
const EXEMPT = new Set(["404", "redirect"]);

// Routes whose /es/ twin has not been built yet, each naming the ticket that
// retires the entry. These keep the build green while the redesign lands page
// by page; the ship ticket (#42) requires this list to be empty.
//
// The list cannot go stale: an entry whose twin now exists, or whose EN page has
// gone, fails the check.
const PENDING = {
  index: "#37 — core audience pages",
  "fare-estimate": "#38 — fare-estimate restyle",
  about: "#39 — utility pages",
  contact: "#39 — utility pages",
  "privacy-policy": "#44 — legal pages",
};

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** "src/pages/es/fees.astro" -> { route: "fees", lang: "es" } */
function toRoute(path) {
  const parts = relative(PAGES, path).replace(PAGE_EXT, "").split(sep);
  return parts[0] === "es"
    ? { route: parts.slice(1).join("/"), lang: "es" }
    : { route: parts.join("/"), lang: "en" };
}

const routes = walk(PAGES).filter((p) => PAGE_EXT.test(p)).map(toRoute);
const en = new Set(routes.filter((r) => r.lang === "en").map((r) => r.route));
const es = new Set(routes.filter((r) => r.lang === "es").map((r) => r.route));

const errors = [];
const pending = [];

for (const route of [...en].sort()) {
  if (EXEMPT.has(route) || es.has(route)) continue;
  if (PENDING[route]) pending.push(`${route} → ${PENDING[route]}`);
  else errors.push(`/${route} has no /es/${route} — every route ships EN and ES together`);
}

for (const route of [...es].sort()) {
  if (!en.has(route)) errors.push(`/es/${route} has no English twin at /${route}`);
}

for (const [route, ticket] of Object.entries(PENDING)) {
  if (!en.has(route)) {
    errors.push(`PENDING lists "${route}", but src/pages has no such English page — drop the entry`);
  } else if (es.has(route)) {
    errors.push(`PENDING lists "${route}" (${ticket}), but /es/${route} now exists — drop the entry`);
  }
}

const scope = `${en.size} EN / ${es.size} ES page${en.size === 1 ? "" : "s"}`;

if (errors.length) {
  console.error(`✗ route parity (${scope})`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n  Exempt by name: ${[...EXEMPT].join(", ")} (copy-map §6.1).`);
  process.exit(1);
}

console.log(`✓ route parity (${scope})`);
for (const p of pending) console.log(`  pending twin: ${p}`);
