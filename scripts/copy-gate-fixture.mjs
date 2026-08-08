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
