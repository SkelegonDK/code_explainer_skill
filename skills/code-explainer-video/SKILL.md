---
name: "code-explainer-video"
description: "Make a narrated developer explainer video (Remotion + ElevenLabs) about a line, block, file, or architecture of a codebase, for onboarding yourself or a teammate."
---

# Code explainer video

Narrated, animated walkthroughs of code for developers. The viewer is an engineer: show real code, name real files and functions, explain *why* and *how*, never simplify into analogies for non-developers.

Stack: Remotion's Code Hike template (syntax-highlighted code that morphs between steps), Mermaid for architecture diagrams, ElevenLabs for narration (the ElevenLabs connector, or the API with a key), and burnt-in captions. Load the `remotion-best-practices` skill when you change the Remotion code in `template/`.

Files next to this SKILL.md ("the skill directory"):
- `template/`: the Remotion source files copied into every video project.
- `references/voice.md`: read in step 8, before generating narration.
- `references/long-form.md`: read first when the video is 15-30 minutes; it splits the work into chapters that each go through steps 2-9.

## 1. Intake: three questions, in this order, before any work

Ask one at a time (AskUserQuestion when available). Do not skip or merge them.

1. **What do you need to understand?** Get the target (a line, block, function, file, flow, or whole architecture), and the reason (fixing a bug, adding a feature, reviewing a PR, onboarding). If the answer is vague ("the auth stuff"), read the code first, then offer 2-4 concrete angles to pick from, e.g. "how a request gets authenticated end to end" vs. "how sessions are stored and expired".
2. **How long should it take?** Offer: ~30 s (one line or block), 1-2 min (a function or module), ~5 min (a subsystem or flow), 15-30 min (codebase onboarding, built as chapters by parallel agents). If they don't know, recommend one based on what you found in step 1.
3. **Is my understanding correct?** After reading the code, send back:
   - the one question the video answers, in one sentence;
   - the length and beat count;
   - the outline: one line per beat (what is on screen + the point it makes);
   - anything you're leaving out on purpose.
   Build only after a yes. Revise and re-confirm on a no. This step exists because narration costs ElevenLabs credits and renders take minutes.

When running unattended (no one to answer), pick the most reasonable reading, state it at the top of your reply, and go on.

## 2. Research the code before writing a word

- Read the actual code. Trace calls to their definitions; don't infer behaviour from names. For a large codebase, fan out with one read-only subagent per area, if your agent supports subagents, and keep only their conclusions.
- Every claim in the narration must map to a file and line you read. Keep a `notes.md` of `claim → path:line` while you research; you use it when fixing problems found in step 7.
- Note what a developer would trip on: hidden side effects, ordering assumptions, error paths, config that changes behaviour, naming that lies.

## 3. Plan beats to the time budget

A **beat** is one visual plus 1-3 sentences of narration. Narration runs at about 150 words per minute (2.5 words/s); each beat gets a 0.6 s tail pause.

| Budget | Beats | Words |
|---|---|---|
| 30 s | 3-4 | ~70 |
| 1-2 min | 6-12 | 150-280 |
| 5 min | 20-30 | ~700 |
| 15-30 min | chapters of 3-5 min, see `references/long-form.md` | |

Beat rules:
- Open with the question being answered and close with a one-line recap. No intro fluff, no "in this video".
- Architecture first, then zoom in: diagram, then the entry-point code, then the interesting line.
- Explain purpose, not lines. Each code beat says what the code is *for* and how it connects to the previous beat, then points at the one or two lines that matter. Never walk through a block line by line.
- Code beats: at most 16 lines (the bottom of the frame is reserved for captions) and 80 characters per line. Cut irrelevant lines and replace them with a `// ...` comment. Consecutive beats that show the same snippet with a different highlight animate smoothly, so reuse snippets and move the highlight.
- Highlight what the narration is talking about with a Code Hike comment directly above it: `// !mark` (next line) or `// !mark(1:4)` (next four lines). Use the language's comment syntax (`# !mark` in Python).
- Diagram beats: Mermaid `flowchart` with at most 8 nodes. Use `TD` for chains longer than four nodes. Keep nodes identical across consecutive diagram beats and only move the `class X hot` line, so the layout doesn't jump.
- Narration is written for the ear: short sentences, say identifiers the way devs say them ("the handle-request function"), no code read aloud symbol by symbol, no line numbers spoken.

## 4. Project setup (once per video)

Set `SKILL_DIR` to the skill directory, then:

```bash
npx create-video@latest --yes --code-hike explainer && cd explainer
npx remotion add @remotion/media && npm rm twoslash-cdn && rm public/code*
rm src/calculate-metadata/process-snippet.ts src/annotations/Callout.tsx src/annotations/Error.tsx src/ProgressBar.tsx src/ReloadOnCodeChange.tsx
cp -R "$SKILL_DIR/template/." .
command -v mmdc || npm i -g @mermaid-js/mermaid-cli
```

Twoslash is removed on purpose: it flags every unresolved import in a code excerpt as a red error. The copied files replace the template's composition with one driven by `beats/`:

- `scripts/build.mjs` turns `beats/` into `public/beats/` (audio, rendered diagrams, `manifest.json`) and measures each beat's audio.
- `src/Main.tsx` plays the beats in sequence: title, code or diagram, audio, captions.
- `src/annotations/Mark.tsx` implements the `!mark` highlight. `src/Captions.tsx` times caption chunks across each beat's audio.

## 5. Write the beats

One pair of files per beat in `beats/`, numbered so they sort (`01`, `02`, … `10`):

- `NN.txt`: optional first line `# <on-screen title>` (use `path/to/file.ts:42-60` for code beats, a short heading for diagrams), then the narration.
- One visual: `NN.<ext>` with the code excerpt (the extension sets the highlighting language: `.ts`, `.py`, `.go`, …) **or** `NN.mmd` with a Mermaid diagram. Highlight a diagram node with `classDef hot fill:#facc15,color:#000,stroke:#facc15` and `class NodeId hot`.

Example pair:

```
beats/04.txt
# src/auth/session.ts:31-44
Sessions are renewed lazily. The expiry check only runs when a request arrives, so an idle session never gets cleaned up here.

beats/04.ts
export async function getSession(id: string) {
  const s = await store.get(id);
  // !mark(1:3)
  if (s && s.expiresAt < Date.now()) {
    return renew(s);
  }
  return s;
}
```

## 6. Draft pass (no credits)

1. `node scripts/build.mjs` with no `beats/*.mp3` and no key writes silent placeholder audio at the estimated length and prints the total. If it's more than 15% over or under the budget, cut or add beats now.
2. Render stills of the moments with the most on screen, and of the moment each highlight lands (about 1.5 s into a beat): `npx remotion still Main out/check.png --frame=<n> --scale=0.5`. Look at them. Fix overflowing lines, unreadable diagrams, and highlights on the wrong line.

## 7. Independent fact-check (before any narration is generated)

The author of a script is the worst person to check it. Have a reviewer that did not write it check every claim against the code. Do this even when running unattended.

- **If your agent supports subagents**, start a fresh one. Give it the repository path, every `beats/NN.txt` and its visual, and this brief, but not `notes.md` or your outline, so that it forms its own reading of the code:
  > Check this explainer script against the code. List every factual claim in the narration and in the on-screen titles. For each, find the code that confirms or contradicts it, tracing calls to their definitions. Return one row per claim: `beat | claim | correct / wrong / unverifiable | path:line | why`. Also flag code excerpts that differ from the source (other than `// ...` cuts and `!mark` comments), titles whose `path:line` range is wrong, anything important about this code that the script states misleadingly, and code beats whose narration walks through the lines without saying what the code is for.
- **Otherwise**, do a second pass yourself: for each claim, reopen the cited code and check it there, not against `notes.md`.

Fix every `wrong` claim, cut or soften every `unverifiable` one, and rewrite flagged line-by-line beats around their purpose. Rerun the draft build, and send only the changed beats back for a second check.

## 8. Voice and render

1. Read `references/voice.md` and generate one narration file per beat with the first option available: the ElevenLabs connector, an ElevenLabs API key, another text-to-speech provider, or none (silent video with captions). Use one voice for the whole video.
2. `node scripts/build.mjs` again. It uses `beats/NN.mp3` when present, so changing one beat means replacing just that file.
3. Render once: `npx remotion render Main out/explainer.mp4`. Check that video and audio durations match (`ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 out/explainer.mp4`) and, unless the video is meant to be silent, that the audio is not (`ffmpeg -i out/explainer.mp4 -af volumedetect -vn -f null - 2>&1 | grep mean_volume`; placeholder audio reads about -91 dB).

## 9. Before handing over

- Watch, or at least listen to, the first and last beats and one in the middle. If an identifier is mispronounced, respell it phonetically in `NN.txt` and re-voice only that beat. Captions show the narration text, so a phonetic respelling appears there too; keep respellings readable.
- Any narration that changed after step 7 goes back through it.
- Deliver the mp4 with a one-line summary of the question it answers. Never upload or publish it anywhere without explicit permission.
