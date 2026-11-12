---
name: "code-explainer-video"
description: "Make a narrated developer explainer video (Remotion + ElevenLabs) about a line, block, file, or architecture of a codebase, or about a language or library concept with no codebase, for onboarding yourself or a teammate."
---

# Code explainer video

Narrated, animated walkthroughs of code for developers. The viewer is an engineer: show real code, name real files and functions, explain *why* and *how*, never simplify into analogies for non-developers. How much the viewer already knows about the subject is asked in intake and sets what the script assumes.

Stack: Remotion's Code Hike template (code in the Monokai theme that morphs between steps), diagrams and charts drawn and animated in Remotion (diagrams are laid out by dagre), ElevenLabs for narration (the ElevenLabs connector, or the API with a key), and burnt-in captions. Load the `remotion-best-practices` skill when you change the Remotion code in `template/`.

Files next to this SKILL.md ("the skill directory"):
- `template/`: the Remotion source files copied into every video project.
- `references/voice.md`: read in step 10, before generating narration.
- `references/long-form.md`: read first when the video is 15-30 minutes; it splits the work into chapters, says who runs which step for each, and joins them.

`<name>-draft/` and the video project `<name>/` go in the current directory unless the user names a place. Both are kept out of git (steps 2 and 7), so they never enter the user's repository.

## Concept topics (no codebase)

When the subject is a language or library concept ("how do variables work in JavaScript") rather than a repository, the code you research is code you write:

- Write small runnable examples in `<name>-draft/examples/`. Run each one and record the command and its real output in `notes.md`.
- Every claim maps to an example's path and line, or to a sentence in the official documentation; record its URL and the sentence.
- Code beats are excerpts of the examples, saved as `NN.js` whatever the example's extension.
- In step 6, give the reviewer the examples with the beats and ask it to rerun them. Tell it that the examples and the cited documentation stand in for the repository, and that diagram nodes are concepts, not modules.
- Name every example `.mjs`, or `.cjs` when it needs `require` or non-strict code. A plain `.js` file changes meaning in step 7, because the project's `package.json` says `"type": "module"`.

## 1. Intake: four questions, in this order, before any work

Ask one at a time (AskUserQuestion when available). Do not skip or merge them.

1. **What do you need to understand?** Get the target (a line, block, function, file, flow, or whole architecture), and the reason (fixing a bug, adding a feature, reviewing a PR, onboarding). If the answer is vague ("the auth stuff"), read the code first, then offer 2-4 concrete angles to pick from, e.g. "how a request gets authenticated end to end" vs. "how sessions are stored and expired".
2. **How well do you know the subject?** Offer exactly these three. The subject is what question 1 named, not programming in general: a senior engineer can be new to it.
   - **New to the subject**: has not met this code or the idea behind it.
   - **Familiar with the subject**: knows the idea, but not how this codebase does it.
   - **Expert in the subject**: knows how this is usually built, and wants what is unusual or risky here.

   If they don't know, use "Familiar with the subject".
3. **How long should it take?** Offer: ~30 s (one line or block), ~1 min or ~2 min (a function or module), ~5 min (a subsystem or flow), 15-30 min (codebase onboarding, built as chapters by parallel agents). If they don't know, recommend one based on what you found in question 1 and on the level: someone new to the subject needs more time for the same code.
4. **Is my understanding correct?** After reading the code, send back:
   - the one question the video answers, in one sentence;
   - the title: a short phrase naming what the video explains, specific to this codebase or concept (e.g. "How API sessions expire and renew", not "Code explainer"), and its file name, `<name>`, the title in kebab-case (`how-api-sessions-expire-and-renew`);
   - the level, the length and the beat count;
   - the outline: one line per beat (what is on screen + the point it makes);
   - anything you're leaving out on purpose.
   Build only after a yes. Revise and re-confirm on a no. This step exists because narration costs ElevenLabs credits and renders take minutes.

When running unattended (no one to answer), pick the most reasonable reading, state it at the top of your reply, and go on.

## 2. Research the code before writing a word

- Read the actual code. Trace calls to their definitions; don't infer behaviour from names. For a large codebase, fan out with one read-only subagent per area, if your agent supports subagents, and keep only their conclusions.
- Start the draft folder with `mkdir -p <name>-draft/beats && echo '*' > <name>-draft/.gitignore`; the `.gitignore` keeps it out of any enclosing repository.
- Every claim in the narration must map to a file and line you read. Keep `<name>-draft/notes.md`, a log of `claim → path:line` while you research; you use it when fixing problems found in step 6.
- Note what a developer would trip on: hidden side effects, ordering assumptions, error paths, config that changes behaviour, naming that lies.
- For every error the video covers, record in `notes.md` the condition that triggers it, the line that throws, rejects or returns it (with its type and message), each function it passes through, and the line that catches it and what that does. If nothing catches it, record what happens instead, such as a crashed process or a 500 response.

## 3. Plan beats to the time budget

A **beat** is one visual plus 1-3 sentences of narration. Narration runs at about 150 words per minute (2.5 words/s), and each beat ends with a 0.6 s pause, so words ≈ (seconds − 0.6 × beats) × 2.5.

| Budget | Beats | Words |
|---|---|---|
| 30 s | 3-4 | ~70 |
| 1 min | 6-8 | ~140 |
| 2 min | 10-14 | ~280 |
| 5 min | 20-30 | ~710 |
| 15-30 min | chapters of 3-5 min, see `references/long-form.md` | |

The level sets what the script assumes and where it spends its time:

| Level | Assume the viewer knows | Spend the time on |
|---|---|---|
| New to the subject | nothing about the subject | what it is for and the terms it uses, each defined once, then the main path through the code. More diagrams, shorter code excerpts, one idea per beat. |
| Familiar with the subject | the idea and its vocabulary | how this codebase does it: the structure, the flow, where things live. |
| Expert in the subject | the idea and the usual way to build it | only what is unusual here: edge cases, trade-offs, hidden coupling, where it departs from the usual way. No walkthrough. |

Beat rules:
- Open with the question being answered and close with a one-line recap. No intro fluff, no "in this video".
- Architecture first, then zoom in: diagram, then the entry-point code, then the interesting line.
- Explain purpose, not lines. Each code beat says what the code is *for* and how it connects to the previous beat, then points at the one or two lines that matter. Never walk through a block line by line.
- Code beats: at most 16 lines (the bottom of the frame is reserved for captions) and 80 characters per line. Cut irrelevant lines and replace them with a `// ...` comment. The code is centred and sized to fill the frame: an excerpt at those limits is set at about 32 px, and a shorter and narrower one grows, up to 80 px, so every line you cut and every long line you shorten makes the rest easier to read. A beat that repeats the previous beat's snippet keeps the code still and moves only the marks.
- Mark what the narration is talking about with a Code Hike comment directly above it, in the language's comment syntax (`# !mark` in Python): `// !mark` (next line), `// !mark(1:4)` (next four lines), or `// !mark[/expiresAt/]` (the part of the next line that matches the regex), which boxes one name or expression when the point is not the whole line. While a mark is lit, the lines without one are dimmed.
- Time each mark to the sentence that talks about it by putting the sentence's number after it: `// !mark 2` is lit during the second sentence of the beat's narration, `// !mark(1:3) 2-3` during the second and third, and a mark with no number during the whole beat. Leave the first sentence unmarked when it says what the code is for, so the viewer sees the whole excerpt first, and move the mark as the following sentences point at lines. Marks may overlap.
- A mark can carry a label, written after the number: `// !mark 2 runs on every request`. It shows under the mark's last line while the mark is lit. Use one for what the code cannot show and the narration cannot hold on screen: a concrete value (`s.expiresAt = 10:31, now = 10:45`), a result (`returns null`), or a name for what the lines do. At most two per beat. A label is indented like its line and must fit in 80 characters with that indentation. It is a claim, so it is fact-checked like the narration. A label whose first word is a number needs a sentence range before it (`// !mark 1-3 3 retries at most`).
- Errors: show when and where an error happens, not only that one can. In one beat, `!mark` the condition and put `// !error <Type>: <message>` directly above the line that throws (`// !error(1:2)` for two lines). `!error` is a red mark whose label is the message, so write the message the way the error would print, with the type and message the code produces, and number both: the mark with the sentence that states the condition, the error with the sentence that says it fails (`// !error 3 SessionExpired: session expired at 10:31`). The narration states the condition in words. Then show where the error lands: a code beat that marks the `catch`, or a diagram with `errors`. If nothing catches it, say what happens instead. A rejected promise, an error return value (Go's `err`, a `Result`) and an error callback are errors too: put `!error` above the line that rejects or returns it.
- Diagram beats: boxes and arrows, at most 8 nodes, labels of at most 24 characters. The layout is automatic. Give each sentence of the narration one node to talk about, or a few that belong together, in the order the arrows run, because the highlight moves from node to node as the sentences are spoken. A tree, such as a file tree or a call tree, is a diagram whose arrows all run from parent to child.
- Chart beats: a bar chart to compare 2 to 8 values, or a line chart for 3 to 8 values that have an order, such as releases or input sizes. One series, names of at most 10 characters. Use only numbers you read in the repository or got by running a command. Never estimate a number.
- Narration is written for the ear: short sentences, say identifiers the way devs say them ("the handle-request function"), no code read aloud symbol by symbol, no line numbers spoken. A sentence ends at `.`, `!` or `?` followed by a space, so avoid abbreviations such as "e.g." in narration: they split a sentence and shift `focus` and the numbered marks.

## 4. Write the beats

The script comes first, and nothing is built until it has passed steps 5 and 6. Write it in `<name>-draft/beats/`, one pair of files per beat, numbered so they sort (`01`, `02`, … `10`):

- `NN.txt`: optional first line `# <on-screen title>` (use `path/to/file.ts:42-60` for code beats, a short heading for diagrams and charts), then the narration.
- One visual: `NN.<ext>` with the code excerpt (the extension sets the highlighting language: `.ts`, `.py`, `.go`, …) **or** `NN.diagram.json` with a diagram **or** `NN.chart.json` with a chart.

Example code beat:

```
beats/04.txt
# src/auth/session.ts:31-44
Sessions are renewed lazily. The expiry check only runs when a request arrives, so an idle session never gets cleaned up here.

beats/04.ts
export async function getSession(id: string) {
  const s = await store.get(id);
  // !mark(1:3) 2
  // !mark[/Date.now\(\)/] 2
  if (s && s.expiresAt < Date.now()) {
    return renew(s);
  }
  return s;
}
```

The whole excerpt shows during the first sentence. During the second, the `if` block is marked, `Date.now()` is boxed and the other lines are dimmed.

Example error beat (the condition is marked yellow during the second sentence, the throw red with its message under it during the third):

```
beats/05.txt
# src/auth/session.ts:31-44
A session that is past its expiry is not renewed here. The check compares the stored expiry with the clock. When it is past, get-session throws session-expired.

beats/05.ts
export async function getSession(id: string) {
  const s = await store.get(id);
  // !mark 2
  if (s.expiresAt < Date.now()) {
    // !error 3 SessionExpired: session expired at 10:31
    throw new SessionExpired(s.id, s.expiresAt);
  }
  return s;
}
```

Example diagram beat:

```
beats/02.txt
# How a request gets authenticated
Every request passes through three parts. The auth middleware reads the cookie first. It then asks the session store whether that session is still valid.

beats/02.diagram.json
{
  "nodes": { "client": "Browser", "mw": "authMiddleware", "store": "SessionStore" },
  "edges": [["client", "mw", "cookie"], ["mw", "store"]],
  "focus": [null, "mw", "store"]
}
```

- `nodes` maps an id to its label. The nodes appear on screen in the order listed. Children are also placed in that order (left to right when the arrows run down, top to bottom when they run right) whenever it needs no crossed edges and no edge through a box, which a tree always satisfies; otherwise the layout may reorder them.
- An edge is `[from, to]` or `[from, to, label]`. Two edges between the same pair of nodes are both drawn. An edge from a node to itself is not allowed.
- `errors` is optional: edges in the same format, drawn in red from where an error is thrown to where it is caught, labelled with the error's type (`["store", "mw", "SessionExpired"]`). Each one draws when the highlight first lands on the node it leaves, after the error edge before it has drawn, so put that node in `focus` for the sentence that says it fails. An error edge whose node is never in `focus` draws in with the other edges.

Example chart beat:

```
beats/06.txt
# p95 latency of getSession
Caching the session cut the lookup time sharply. Before the cache, a lookup took four hundred and twenty milliseconds. With it, the same lookup takes ninety five.

beats/06.chart.json
{
  "type": "bar",
  "unit": " ms",
  "source": "bench/results/get-session.json",
  "data": { "no cache": 420, "with cache": 95 },
  "focus": [null, "no cache", "with cache"]
}
```

- `type` is `bar` or `line`. `data` maps a name to its value, in the order shown. Values are measured from zero and cannot be negative. A value of 0 is drawn as a thin stub.
- `unit` is optional and is appended to each value as written, so include the space: `" ms"`, but `"%"`. A value or name too long for its slot is shrunk to fit, so scale large numbers into the unit: `12.3` with `" M"`, not `12300000`.
- `source` is the file the values come from, or the command that produced them. It is not shown; the fact-checker uses it.
- Every bar shows its value. A line shows the value of its first point, its last point and the point in focus.

In both diagrams and charts:

- `focus` has one entry per sentence of the narration: the node id or `data` name that sentence is about, a list of them (`["let", "const"]`) to highlight together, or `null` for none. The last entry holds for any sentences after it.
- To keep a diagram or chart on screen across beats, repeat the file in the next beat and change only `focus`. It then stays where it is and only the highlight moves.

## 5. Check length and diagrams (no Remotion yet)

1. **Length.** Estimate the runtime: narration words (`grep -hv '^# ' <name>-draft/beats/*.txt | wc -w`) ÷ 2.5, plus 0.6 s per beat. If it's more than 10% over or under the budget, cut or add beats now.
2. **Code excerpts.** At most 16 lines and 80 characters per line, not counting `!mark` and `!error` comments. A label or `!error` message counts as one line: its row is kept free under the mark for the whole beat. No mark is numbered past the last sentence of its beat.
3. **Diagrams and charts.** A diagram has at most 8 nodes and 24 characters per label, every id in `edges`, `errors` and `focus` is a key of `nodes`, and no edge goes from a node to itself. A chart has 2 to 8 values, names of at most 10 characters and a `source`, and every name in `focus` is a key of `data`. `focus` has no more entries than the narration has sentences. A beat that continues a diagram or chart differs from the beat before only in `focus`; check with `diff`.

## 6. Independent fact-check (before any Remotion code or narration)

The author of a script is the worst person to check it. Have a reviewer that did not write it check every claim and every diagram against the code. Do this even when running unattended.

- **If your agent supports subagents**, start a fresh one. Give it the repository path, every file in `<name>-draft/beats/`, and this brief, but not `notes.md` or your outline, so that it forms its own reading of the code:
  > Check this explainer script against the code. List every factual claim in the narration, in the on-screen titles and in the labels of marks (the text after `// !mark`, and after its sentence number if it has one). For each, find the code that confirms or contradicts it, tracing calls to their definitions. Return one row per claim: `beat | claim | correct / wrong / unverifiable | path:line | why`. For each diagram (`.diagram.json`, where `nodes` maps ids to labels and an edge is `[from, to, label]`), check that every node is a real module, function or component, that every edge is a real call or data flow in the direction drawn, that every edge in `errors` is an error that really travels from the first node to the second, and that no edge important to the narration is missing; report each problem as a row. For each `// !error <message>` in a code excerpt (a number or range before the message is the sentence it shows during, not part of it), check that the line under it throws, rejects or returns that error, with that type and message, under the condition the narration states, and that the narration says correctly where it is caught. For each chart (`.chart.json`), check every value and the unit against its `source`, opening the file or rerunning the command; a value you cannot check is `unverifiable`. Also flag code excerpts that differ from the source (other than `// ...` cuts and `!mark` and `!error` comments), titles whose `path:line` range is wrong, anything important about this code that the script states misleadingly, and code beats whose narration walks through the lines without saying what the code is for.
- **Otherwise**, do a second pass yourself: for each claim, node and edge, reopen the cited code and check it there, not against `notes.md`.

Fix every `wrong` row, cut or soften every `unverifiable` one, and rewrite flagged line-by-line beats around their purpose. Rerun step 5 after the fixes, because they change the length too. Send only the changed beats back, to the same reviewer if it can be resumed, otherwise to a fresh one with the same brief. Repeat until a check returns no `wrong` or `unverifiable` row; fix any remaining wording notes without another round.

## 7. Project setup (once per video)

Only now build the video project. Run this as one shell command, with the skill directory's absolute path in place of `<skill dir>`, because many agents do not keep variables or the working directory between commands:

```bash
SKILL_DIR="<skill dir>" && npx create-video@latest --yes --code-hike <name> \
  && rm -rf <name>/.git && echo '*' >> <name>/.gitignore \
  && mv <name>-draft/* <name>/ && rm -r <name>-draft && cd <name> \
  && npx remotion add @remotion/media && npm i @dagrejs/dagre@3 && npm rm twoslash-cdn && rm public/code* \
  && rm src/calculate-metadata/process-snippet.ts src/annotations/Callout.tsx src/annotations/Error.tsx src/ProgressBar.tsx src/ReloadOnCodeChange.tsx \
  && cp -R "$SKILL_DIR/template/." .
```

Every later command runs in `<name>/`; start each with `cd <name> &&` if your shell does not keep the directory.

`create-video` refuses to scaffold into an existing folder, which is why the script lives in `<name>-draft/` until now. Outside a git repository it also makes `<name>/` a repository of its own; inside one it does not, and the project shows up as untracked files there. Removing `.git` and adding `*` to the project's `.gitignore` keeps the project out of every repository in both cases. Twoslash is removed on purpose: it flags every unresolved import in a code excerpt as a red error. Dagre is pinned to major version 3 because the layout depends on it. The scaffold's config files, `src/index.ts`, `src/utils.ts`, `src/annotations/InlineToken.tsx` and `src/calculate-metadata/theme.tsx` stay. The copied files replace the template's composition with one driven by `beats/`:

- `scripts/build.mjs` turns `beats/` into `public/beats/` (audio, visuals, `manifest.json`), measures each beat's audio and prints each beat's frame range.
- `src/Main.tsx` plays the beats in sequence: title, visual, audio, captions.
- `src/Diagram.tsx` and `src/Chart.tsx` draw diagram and chart beats, and `src/figure.ts` times their animation.
- `src/annotations/Mark.tsx` implements `!mark` and `!error`, and `src/CodeTransition.tsx` times them to the sentences, and centres the code and sizes it to the frame, from its rows and its longest row. `src/Captions.tsx` times caption chunks across each beat's audio.
- `src/Root.tsx` sets the colour theme, `monokai`. Change it there only if the user asks for another; `src/calculate-metadata/theme.tsx` lists the choices.

Code excerpts in `beats/` are not meant to compile, so do not run the project's `tsc` or `npm run lint`: they report errors there.

## 8. Draft build (no credits)

1. `node scripts/build.mjs` with no `beats/*.mp3` and no key writes silent placeholder audio at the estimated length, prints each beat's frame range and ends with the video's length (`8 beats, 76.0s of video`). It stops with a one-line message naming the beat when a `.txt` or visual is missing, a beat has more than one visual, an id in `edges` or `focus` is unknown, `focus` has more entries than the narration has sentences, a mark is numbered with a sentence the narration does not have, or an edge goes from a node to itself. Fix that beat and run it again.
2. Render stills of the moments with the most on screen, and of each code beat while its marks are lit: `npx remotion still Main out/check.png --frame=<n> --scale=0.5`. Take `<n>` from the frame ranges the build printed; 60 frames are 2 s. A mark with no number is lit from 1.5 s into its beat. A numbered mark is lit while its sentence is spoken, so check a beat that has them on a contact sheet (step 9, item 1): in each tile the lit mark and its label must be what the caption is talking about. A still from the first half second of a code beat shows no code; that is the still, not the video. The first still after setup sometimes fails with a delayRender timeout; run it once more. If stills and renders keep failing with "Waiting for root component to load", which happens on a busy machine, add `--browser-executable="<path to an installed Chrome>"` to every `remotion` command. Look at the stills. Code that looks small has one long line or label holding the size down: shorten it. Fix overflowing lines and labels, marks or `!error` marks on the wrong line or lit during the wrong sentence, and captions covering code.

## 9. Animate the diagrams and charts (no credits)

Skip this step when the video has no diagram or chart beats.

`src/Diagram.tsx` and `src/Chart.tsx` animate each beat from its JSON. The nodes of a diagram appear in the order listed, and each arrow draws once both its ends are on screen. The bars of a chart grow one after another, and a line draws from left to right. In both, the highlight moves to the next `focus` entry when the next sentence starts. An error edge draws when the highlight lands on the node it leaves. A beat that continues the previous beat's diagram or chart does not build in again. The timing follows the audio, so it still holds after the placeholder audio is replaced in step 10.

A still cannot show motion, so check each run of diagram or chart beats on a contact sheet:

1. Render the run, from the first frame of its first beat to the last frame of its last, and tile it at two frames per second:
   ```bash
   npx remotion render Main out/anim.mp4 --frames=<first>-<last> --scale=0.5
   ffmpeg -y -v error -i out/anim.mp4 -vf "fps=2,scale=480:-1,tile=4x6" out/anim-%d.png
   ```
   A figure builds in within its first two seconds, too fast for this sheet, so also tile the first two seconds of each beat that builds a new diagram or chart at ten frames per second (`<f>` is the beat's first frame, 60 frames are 2 s):
   ```bash
   npx remotion render Main out/build.mp4 --frames=<f>-<f+59> --scale=0.5
   ffmpeg -y -v error -i out/build.mp4 -vf "fps=10,scale=480:-1,tile=4x5" out/build-%d.png
   ```
2. Read every sheet left to right, top to bottom. In each tile the highlighted node, bar or point must be the one the caption is talking about. Each red error edge must draw in the tile where the caption says the error happens. On the build sheets the nodes must appear in an order that follows the arrows. A continued diagram or chart must not move or rebuild.
3. Render a still of the last frame of each of these beats. Every label and value must be easy to read, and nothing may overlap or touch the captions.
4. Fix problems in the JSON, then rebuild and check again. Reorder `nodes` to change the order of appearance, and the order of children where the layout allows it (step 4). Realign `focus` with the sentences. Split a beat whose narration covers more than three nodes or values. Shorten labels, or drop a node or a value, when the text is small or crowded. A diagram whose nodes, edges or labels changed, and a chart whose values changed, goes back through step 6.

## 10. Voice and render

1. Read `references/voice.md` and generate one narration file per beat with the first option available: the ElevenLabs connector, an ElevenLabs API key, another text-to-speech provider, or none (silent video with captions). Use one voice for the whole video.
2. `node scripts/build.mjs` again. Each beat's audio comes from `beats/NN.mp3`, else the API when a key is set, else silent placeholder. A rebuild without the key keeps beats voiced through the API. The build never plays stale narration: if a beat's narration changed and its audio did not, it stops and names the beat to re-voice. Changing the voice or the model re-voices every API-voiced beat.
3. Render once: `npx remotion render Main out/<name>.mp4 --metadata title="<title>"`. Check that video and audio durations match (`ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 out/<name>.mp4`) and, unless the video is meant to be silent, that the audio is not (`ffmpeg -i out/<name>.mp4 -af volumedetect -vn -f null - 2>&1 | grep mean_volume`; placeholder audio reads about -91 dB).

## 11. Before handing over

- Watch, or at least listen to, the first and last beats and one in the middle. If an identifier is mispronounced, respell it phonetically in `NN.txt` and re-voice only that beat. Captions show the narration text, so a phonetic respelling appears there too; keep respellings readable.
- If you cannot listen, say so in the hand-over: pronunciation is unchecked. List the identifiers most likely to be mispronounced, with their beats, so the user knows where to listen. Transcribing the audio to check it costs credits, so do it only if the user agrees.
- Any narration, code excerpt, diagram or chart that changed after step 6 goes back through it. The wording fixes that step 6 lets you make without another round are the one exception.
- Deliver `out/<name>.mp4` under its title, with a one-line summary of the question it answers. Tell the user where the project folder `<name>/` is and that it is not part of their repository's history. Never upload or publish it anywhere without explicit permission.
