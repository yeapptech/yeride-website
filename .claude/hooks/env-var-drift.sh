#!/usr/bin/env bash
# PostToolUse hook: catch PUBLIC_ env vars that the deploy workflow never writes.
#
# Adding a client env var is a four-place change: .env.example, the "Create env
# file" step in deploy-all.yml, a GitHub Secret, and REQUIRED in
# scripts/env-required.mjs if the var is required. Miss the workflow and the var
# is an empty string in production; since #59 that fails the build rather than
# shipping silently, but only for vars listed in REQUIRED. Miss .env.example and
# `npm run checks` fails on the PR (#70); miss the workflow line for a REQUIRED
# var and it fails there too, since #90.
#
# WHAT IS LEFT FOR THIS HOOK after #90 gave the workflow step a real gate: a
# PUBLIC_ var that source code READS but that is in neither REQUIRED nor the
# workflow. No gate sees that one — check-deploy-env.mjs compares the step
# against REQUIRED, and a var absent from REQUIRED is absent from both sides, so
# the two agree about a variable that will be empty in production. This hook is
# the only thing that starts from what the code reads. It is still an assumed
# guard, not a gate — it fires only when someone edits a reading file, with a
# hook-aware tool, in a session where it is installed — so the durable answer
# for a var that matters is to put it in REQUIRED and let the gates take over.
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
