# code-explainer-video

An agent skill that turns a piece of code into a narrated, animated explainer video. It works on any scope: one line, a function, a file, or a whole architecture.

You ask your coding agent something like *"make a 2-minute video explaining how a request gets authenticated in this repo"*. The agent reads the code, writes a script, checks the outline with you, and renders an MP4. The video has syntax-highlighted code that morphs between steps, animated diagrams and charts, a voiceover, and burnt-in captions.

## Why

Reading unfamiliar code is slow, and written docs drift out of date. A short video that walks through the real code, with real file names and line ranges, is often the fastest way to:

- onboard yourself or a teammate to a codebase;
- explain a tricky bug or a PR to a reviewer;
- record how a subsystem works before the person who wrote it moves on.

The skill is written for developers watching. It shows real code, explains *why* and *how*, and avoids analogies meant for non-technical viewers. Every claim in the narration has to map to a file and line the agent actually read, and the agent fact-checks the script against those notes before it hands the video over.

## How it works

1. **Intake.** The agent asks four questions, one at a time: what you need to understand, how well you know the subject (new to it, familiar with it, or expert in it), how long the video should be (30 s to 30 min), and whether its outline is correct. The level sets what the script assumes you know. The agent builds nothing until you approve the outline.
2. **Research.** The agent traces the code to its definitions and keeps a `claim → path:line` log.
3. **Script.** The agent writes the script as *beats*. Each beat is one visual (a code excerpt, a diagram or a chart) and one to three sentences of narration, sized to the time budget at about 150 words per minute.
4. **Length and diagram check.** The agent estimates the runtime from the word count and checks every diagram and chart against the size limits.
5. **Independent fact-check.** A fresh reviewer, which did not write the script, checks every claim, code excerpt, diagram and chart value against the code. Where the agent supports subagents this is a separate agent. Otherwise the agent does a second pass, reopening each piece of cited code. Nothing is built until the script passes.
6. **Draft build.** Only now does the agent create the [Remotion](https://www.remotion.dev/) project from the [Code Hike](https://codehike.org/) template. It builds the video with silent placeholder audio and renders stills to catch overflowing code and highlights on the wrong line. This costs no credits.
7. **Diagram and chart animation.** Diagrams (flows and trees) and charts (bar and line) are drawn in Remotion, not imported as images. Boxes appear one by one, arrows and lines draw themselves, bars grow, and a highlight moves from item to item as the narration reaches each one. The agent checks the motion on contact sheets.
8. **Voice and render.** The agent voices each beat, renders once, and checks that audio and video line up.
9. **Long form.** For 15 to 30 minute onboarding videos, the agent plans chapters, writes them with parallel subagents, fact-checks each one, builds them, and joins them into one file. It also keeps the individual chapter files.

The full procedure is in [`skills/code-explainer-video/SKILL.md`](skills/code-explainer-video/SKILL.md).

## Requirements

- An agent that supports [Agent Skills](https://agentskills.io), such as Claude Code, Codex, Gemini CLI, OpenCode or GitHub Copilot.
- Node.js 20.19 or newer.
- `ffmpeg` and `ffprobe` (`brew install ffmpeg` on macOS).

Remotion downloads its own headless browser on the first render.

## Install

With the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add SkelegonDK/code_explainer_skill
```

Or clone the repo and symlink the skill, so that a `git pull` updates every agent at once:

```bash
git clone https://github.com/SkelegonDK/code_explainer_skill.git
mkdir -p ~/.agents/skills ~/.claude/skills
ln -s "$PWD/code_explainer_skill/skills/code-explainer-video" ~/.agents/skills/code-explainer-video
ln -s ~/.agents/skills/code-explainer-video ~/.claude/skills/code-explainer-video
```

`~/.agents/skills` is the shared location that several agents read. Add the same kind of link for any agent that only reads its own folder, for example `~/.codex/skills` or `~/.gemini/skills`.

## Usage

Ask in plain language. The agent picks up the skill from its description, or you can call it by name (`/code-explainer-video` in Claude Code).

```text
Make a 30-second video explaining the retry loop in src/http/client.ts.
Explain how jobs move through the queue in this repo, about 5 minutes. I'm new to it.
Make a 20-minute onboarding video for this codebase.
```

Each video gets a title that names what it explains, proposed with the outline for you to approve, for example *How API sessions expire and renew*. The file is named after it (`how-api-sessions-expire-and-renew/out/how-api-sessions-expire-and-renew.mp4`), and the title is written into the MP4's metadata so video players show it. Long-form videos also get one titled file per chapter. The agent never uploads or publishes the video unless you explicitly ask it to.

## Getting the most out of ElevenLabs

[ElevenLabs](https://elevenlabs.io) gives the best results and is the default. There are two ways to connect it.

**The ElevenLabs connector (recommended).** Connect ElevenLabs in your agent (in Claude, under connector settings). The agent then voices each beat directly, with no API key to manage. Each connector call produces two takes and charges for both, so the agent tells you the credit cost before it voices more than about ten beats.

**An API key.** Create a key in the ElevenLabs dashboard and give it to the agent when asked. The agent keeps it in an environment variable and never writes it to a file. This path costs about half as much per beat because it makes one take. It also sends the previous and next beat's text with each request, which keeps the intonation consistent across beats.

Tips:

- **Approve the outline before voicing.** Credits are spent per character of narration. Changes are cheap during the silent draft pass and expensive afterwards.
- **Change one beat at a time.** The build script re-voices only beats whose narration changed, so fixing one sentence costs one beat.
- **Use one calm narrator for the whole video,** and for every chapter of a long one. The skill picks from ElevenLabs' educational voices by default. Name a voice if you have a favourite.
- **Fix pronunciation by respelling.** If a voice mangles an identifier, the agent respells it phonetically in that beat's script and re-voices only that beat.
- **Budget for length.** One minute of narration is about 150 words, or roughly 900 characters. Check the [pricing page](https://elevenlabs.io/pricing) to see how many credits your plan includes and how many each model uses per character.

## Without an ElevenLabs account

You still get a full video.

- **Silent video with captions.** Without a key or connector, the build writes silent placeholder audio timed to the narration. The captions are burnt in, so the video can be read as it plays. This works well for async review and for drafts.
- **Another text-to-speech provider.** The skill accepts one audio file per beat from any source: OpenAI, Google Cloud, Azure or Amazon Polly. Tell the agent which one to use.
- **Free and local.** [Kokoro](https://github.com/hexgrad/kokoro) and [Piper](https://github.com/rhasspy/piper) run offline and sound good. On macOS, the built-in `say` command works with no setup, though it sounds robotic.

The agent saves each beat as `beats/NN.mp3` and converts other formats with `ffmpeg`. The rest of the pipeline stays the same. You can switch to ElevenLabs later and re-voice without rebuilding anything else.

## Repository layout

```text
skills/code-explainer-video/
  SKILL.md                 the workflow: intake, research, beats, fact-check, draft, animation, voice, render
  template/                Remotion source files copied over the official Code Hike template
    scripts/build.mjs      beats/ → audio, visuals and a manifest
    src/                   composition, diagrams, charts, captions, highlight annotation
  references/
    voice.md               ElevenLabs connector, API key, other providers, silent fallback
    long-form.md           15-30 minute videos built as parallel chapters
```

The agent scaffolds a fresh project from the official Code Hike template for each video and copies `template/` over it. The template files were last tested with Remotion 4.0.543 and dagre 3.1.3.

## License

[MIT](LICENSE). Videos you render use [Remotion](https://www.remotion.dev/license), which is free for individuals and small teams but requires a company license for larger organisations. Check whether that applies to you.
