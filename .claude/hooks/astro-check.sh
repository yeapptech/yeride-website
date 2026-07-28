#!/usr/bin/env bash
# PostToolUse hook: type-check after an .astro/.ts edit.
#
# `npm run build` (astro check && astro build) is this repo's only verification
# gate, and pushes to main deploy straight to production. This surfaces type
# errors at edit time instead of in GitHub Actions.
#
# Uses the local binary, never `npx`: with node_modules absent, `npx astro`
# prompts to install @astrojs/check and hangs the session waiting on stdin.
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
astro_bin="$repo_root/node_modules/.bin/astro"

file_path="$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')"

case "$file_path" in
  *.astro | *.ts) ;;
  *) exit 0 ;;
esac

# Dependencies not installed yet — stay silent rather than block the edit.
[ -x "$astro_bin" ] || exit 0

if output="$(cd "$repo_root" && "$astro_bin" check 2>&1)"; then
  exit 0
fi

printf 'astro check failed after editing %s\n\n%s\n' "$file_path" "$output" >&2
exit 2
