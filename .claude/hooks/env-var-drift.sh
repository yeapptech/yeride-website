#!/usr/bin/env bash
# PostToolUse hook: catch PUBLIC_ env vars that the deploy workflow never writes.
#
# Adding a client env var is a three-place change: .env, the "Create env file"
# step in deploy-all.yml, and a GitHub Secret. Miss the workflow and the var is
# an empty string in production with no build error — silent breakage.
set -uo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
workflow="$repo_root/.github/workflows/deploy-all.yml"

file_path="$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')"

[ -n "$file_path" ] && [ -f "$file_path" ] && [ -f "$workflow" ] || exit 0

missing=""
while IFS= read -r var; do
  [ -n "$var" ] || continue
  grep -q "$var" "$workflow" || missing="$missing $var"
done < <(grep -oE 'import\.meta\.env\.PUBLIC_[A-Z0-9_]+' "$file_path" |
  sed 's/.*env\.//' | sort -u)

[ -n "$missing" ] || exit 0

msg="Not written by .github/workflows/deploy-all.yml:$missing"
msg="$msg — empty in production. Add to the 'Create env file' step AND as a GitHub Secret."

jq -cn --arg m "$msg" '{
  systemMessage: $m,
  hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: $m}
}'
