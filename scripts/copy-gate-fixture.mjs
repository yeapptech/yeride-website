// One way to run a gate over a throwaway tree. Plain node, no deps.
//
// #81 wrote this inside copy-gate-files.test.mjs; #82 moved it here when a
// second control file needed it, for the reason #57 gives for one pattern list
// and #68 for one normaliser: a gate spawned two ways is two claims about what
// "the gate" does, and the day they drift both files still look right.
//
// It is deliberately thin. What a fixture MEANS — which roots the source gate
// needs, why the dist gate is asserted on its output rather than its exit code —
// is the caller's knowledge and stays in the control file that has the argument
// written down.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** Run `gate` over a throwaway tree of {relativePath: contents}, as { code, out }.
 *
 *  The tree is a temp directory and never the real one: the gates walk their roots
 *  relative to the working directory, so a temp tree is a complete world to them,
 *  and mutating a tracked file would leave the repo dirty if the process were
 *  killed mid-run — these run on every pull request. */
export function runGate(gate, files) {
  const dir = mkdtempSync(join(tmpdir(), "copy-gate-fixture-"));
  try {
    for (const [rel, body] of Object.entries(files)) {
      const path = join(dir, rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body);
    }
    const r = spawnSync(process.execPath, [gate], { cwd: dir, encoding: "utf8" });
    return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Whether the dist gate reported `phrase` against `file`.
 *
 *  The dist gate is asserted on WHAT IT REPORTS, not on its exit code, and that is
 *  deliberate. Its ALLOWED list is keyed to real built paths, so any synthetic
 *  tree fails it with "allowed but no longer appears" — an exit code that would be
 *  1 whatever the fixture said, and therefore proves nothing. Rebuilding the
 *  allowlist inside the fixture would duplicate it, which is the drift the one
 *  shared table exists to prevent. Naming the fixture path AND the phrase is the
 *  precise claim anyway: this file, read this way, yielded this match.
 *
 *  ANCHORED on the gate's own output shape,
 *    <key>  "<matched text>" ×<n> [<view>] — <why>
 *  and both of the looser forms were falsified rather than argued away. Two
 *  independent `includes` over the whole output pass on a file the gate never
 *  opened, because a stale-ALLOWED line carries "insurance" and
 *  "privacy-policy/index.html" between them. Narrowing that to a single LINE is
 *  still not enough — that same line carries both, and "index.html" is a substring
 *  of "privacy-policy/index.html". Requiring the line to START with the key removes
 *  the suffix match, which is what actually made it wrong.
 *
 *  #81 wrote this in copy-gate-files.test.mjs; #99 moved it here when a second
 *  control file needed it, for the reason #82 moved runGate. */
export function reported(out, file, phrase) {
  const key = file.replace(/^dist\//, "");
  return out.split("\n").some((l) => l.trim().startsWith(`${key}  "`) && l.includes(`"${phrase}"`));
}
