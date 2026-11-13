#!/usr/bin/env bash
# Step 7: turns <name>-draft/ into the video project <name>/. Run it in the folder that holds <name>-draft/.
set -euo pipefail
name="${1:?usage: setup.sh <name>}"
skill="$(cd "$(dirname "$0")/.." && pwd)"
remotion=4.0.543 # the version assets/template/ was last tested with

[ -d "$name-draft" ] || { echo "setup.sh: no $name-draft/ in $(pwd)" >&2; exit 1; }
npx --yes "create-video@$remotion" --yes --code-hike "$name"
cd "$name"
rm -rf .git
echo '*' >> .gitignore
mv "../$name-draft"/* . && rm -r "../$name-draft"
npx remotion upgrade --version "$remotion"
npx remotion add @remotion/media
npm i -E @dagrejs/dagre@3.1.3
npm rm twoslash-cdn
rm public/code* src/calculate-metadata/process-snippet.ts src/annotations/Callout.tsx src/annotations/Error.tsx src/ProgressBar.tsx src/ReloadOnCodeChange.tsx
cp -R "$skill/assets/template/." .
cp -R "$skill/assets/audio" public/audio
