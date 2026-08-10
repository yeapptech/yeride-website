// Astro prose gate — a text node in an .astro template must not contain prose.
// Rendered body copy comes from src/i18n/. Wayfinder #88; the rule, its
// boundary and its escape hatch were decided by #79.
//
// WHY A BUILD-TIME RULE RATHER THAN THE CONVENTION. #68 gave the copy gate the
// dist gate's normaliser, so a §5 phrase split across a tag, an entity, an
// escape or a newline now fails at the point of authorship. That POLICES prose
// typed straight into markup; it does not stop it existing. The convention that
// it should not exist was already strong — docs/architecture.md, docs/components.md,
// the `new-page` skill and the `page-consistency` agent all carry it, and check
// 4 of that agent is literally "Copy lives in src/i18n/, not in the component and
// not in the page" — but it is still an agent a human has to remember to run,
// which is the assumed-guard shape #59 is about, not an enforced one. This
// removes the surface instead of watching it.
//
// It is dependency-free and network-free, so unlike items 5 and 7 of the build
// chain it joins `npm run checks` and checks.yml at PR time — the "wrong end of
// the process" #41's review named.
//
// It does NOT replace the copy gate and is orthogonal to it. Even with every
// string in src/i18n, entity and escape evasion INSIDE a string literal still
// needs catching, which is what #68 built.
//
// WHAT IT READS is scripts/astro-prose.mjs — text nodes via the copy gate's own
// tag scanner, and the prose test, with the measurement that chose that test.
// Read that header before loosening anything here; the limits it states are the
// limits of this gate.
//
// THE ESCAPE HATCH is #41's pragma discipline exactly, through the same reader
// (scripts/copy-gate-pragma.mjs) rather than a second copy of the position rule:
//
//     <!-- astro-prose-allow: <why, naming the ticket that retires it> -->
//
// It must OPEN its own comment, it must name a ticket, it covers the line the
// node STARTS on and the line below, and one that matches nothing fails the
// build — so the allowlist cannot outlive its reason. The token differs from
// `copy-gate-allow` because it has to: check-copy-gate.mjs scans .astro files
// too and fails on a `copy-gate-allow` that matches nothing, so a shared token
// would have every prose pragma reported as dead by the other gate.
//
// IT SHIPS WITH ZERO LIVE ENTRIES. The one case #79 named for it dissolved when
// #39 put redirect.astro through BaseLayout with its copy in redirectCopy, so
// the hatch is proved by committed controls rather than by a live user —
// scripts/astro-prose.test.mjs, with scripts/copy-gate-patterns.test.mjs as the
// precedent. An unused hatch is an untested one.

import { readFileSync } from "node:fs";

import { isProse, textNodes } from "./astro-prose.mjs";
import { walk } from "./copy-gate-files.mjs";
import { lineIndex } from "./copy-gate-normalise.mjs";
import {
  TICKET,
  collectPragmas,
  pragmaFor,
  pragmaReader,
  unusedPragmas,
} from "./copy-gate-pragma.mjs";

const ROOT = "src";
const readPragma = pragmaReader("astro-prose-allow");

const errors = [];
const allowed = [];
const pragmas = [];
let scanned = 0;

const files = walk(ROOT).filter((path) => /\.astro$/i.test(path));

for (const file of files) {
  scanned++;
  const source = readFileSync(file, "utf8");

  const { at: lineAt } = lineIndex(source);

  const found = collectPragmas(source, file, readPragma);
  pragmas.push(...found.pragmas);
  for (const at of found.misplaced) {
    errors.push(
      `${at.file}:${at.line}  astro-prose-allow must OPEN its own comment — nothing but ` +
        `whitespace between the comment opener and the pragma, so shipped markup ` +
        `cannot authorise itself`,
    );
  }

  for (const node of textNodes(source)) {
    const text = node.text.trim();
    if (!isProse(text)) continue;

    const here = lineAt(node.at);
    // The pairing rule is the copy gate's, called rather than re-typed — see
    // pragmaFor in copy-gate-pragma.mjs for why the hatch discipline exists once.
    const pragma = pragmaFor(pragmas, file, here);

    // One line, whatever the node's own line breaks — a paragraph wrapped across
    // four source lines is one fault, and printing it as four is the noise that
    // teaches a reader to skim the gate's output.
    const shown = text.replace(/\s+/g, " ");
    const quoted = `"${shown.length > 60 ? `${shown.slice(0, 57)}…` : shown}"`;

    if (!pragma) {
      errors.push(
        `${file}:${here}  ${quoted} — literal prose in a template. Move it to src/i18n/ ` +
          `and render it from there`,
      );
    } else if (!TICKET.test(pragma.reason)) {
      errors.push(
        `${file}:${here}  astro-prose-allow must name the ticket that retires it, e.g. "#88"`,
      );
      pragma.used = true;
    } else {
      pragma.used = true;
      allowed.push(`${file}:${here}  ${quoted} — ${pragma.reason}`);
    }
  }
}

for (const p of unusedPragmas(pragmas)) {
  errors.push(`${p.file}:${p.line}  astro-prose-allow matches nothing any more — delete it`);
}

if (errors.length) {
  console.error(`✗ astro prose (${scanned} files)`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\n  Body copy belongs in src/i18n/, not in an .astro template.`);
  console.error(`  Attributes and props are NOT covered — title and description stay in the`);
  console.error(`  page files by #37's decision. To keep a text node that cannot move, put`);
  console.error(`  "<!-- astro-prose-allow: <why> (#ticket) -->" on the line above it. The`);
  console.error(`  pragma must OPEN its comment, and one that matches nothing fails (#100).`);
  process.exit(1);
}

console.log(`✓ astro prose (${scanned} files)`);
for (const a of allowed) console.log(`  allowed: ${a}`);
