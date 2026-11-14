#!/usr/bin/env bash
# Step 11: deletes a finished video project's node_modules. Run it in the folder that holds <name>/.
# It deletes only inside a project that setup.sh made, so it can never touch the user's own node_modules.
set -euo pipefail
name="${1:?usage: clean.sh <name>}"
[ -f "$name/scripts/build.mjs" ] && [ -d "$name/beats" ] && [ ! -e "$name/.git" ] ||
  { echo "clean.sh: $name/ is not a video project, nothing deleted" >&2; exit 1; }
rm -rf "$name/node_modules"
