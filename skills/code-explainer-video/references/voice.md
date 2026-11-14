# Narration

Use one voice for the whole video, and for every chapter of a long one. Take the first option that is available and use it for every beat: the options use different models, so mixing them changes how beats sound. Every option ends in `beats/NN.mp3`, or in audio that `scripts/build.mjs` makes, so nothing else in the pipeline changes.

## 1. An ElevenLabs MCP server (preferred, no key)

Look for ElevenLabs among your tools first. A connector or MCP server is usually signed in already, so there is no key to handle. If it is there but not signed in, say so and go on to option 2. With the ElevenLabs connector, whose tools are named `creative_…`:

1. `creative_create_flow` once for the video.
2. Pick a calm, clear narrator with `creative_list_voices` (use case `informative_educational`), unless the user named a voice.
3. Price the video before voicing it: make one call as in step 4, with the whole narration as `prompt` and `estimate_only: true`, which returns the cost and generates nothing. For scale, about 150 words in 7 beats cost roughly 750 to 950 credits per take on `eleven_v4`. Tell the user the total and wait for a yes before voicing more than about 10 beats.
4. Per beat, call `creative_generate_speech` with `prompt` (the beat's narration, without the `# title` line), `model_id: "eleven_v4"`, the `voice_id`, the `flow_id`, `generations_count: 1` and a short `context`. The default is two takes, which doubles the cost, and the video uses only one. The call returns at once with `flow_id`, `node_id` and `session_ids`.
5. Call `creative_get_flow_run_status` with the `flow_id` and `session_ids` until `all_completed` or `has_failures` is true, waiting `poll_after_seconds` between calls. If your agent cannot run a plain `sleep`, do other work between calls, such as downloading a finished beat. Then download the take's `content_url`: `curl -sSf -o beats/NN.mp3 "<content_url>"`.

Voice one beat first and compare its length with its words ÷ 2.5: if the voice is more than 10% slower, cut words from the other beats before voicing them, because voices differ in pace. Keep only a few generations running at once and start the next as one finishes: starting many at once fails with a concurrency-limit error. Never repeat a generate call to retry, because it charges again.

Another ElevenLabs MCP server has other tool names, and the same rules hold: one call per beat, one take, saved as `beats/NN.mp3`.

## 2. A provider the user chooses

Without an ElevenLabs tool, ask the user which of these to use. For a hosted provider, ask for the path of an `.env` file that holds its key.

| `TTS` | Key in the `.env` file | Voice | Model |
|---|---|---|---|
| `elevenlabs` | `ELEVENLABS_API_KEY` | George | `eleven_multilingual_v2` |
| `openai` | `OPENAI_API_KEY` | `cedar` | `gpt-4o-mini-tts` |
| `google` | `GEMINI_API_KEY` | `Charon` | `gemini-3.8-flash-tts` |
| `kokoro` | none: a local model from Hugging Face, free | `af_heart` | Kokoro 82M |

```bash
TTS=openai node --env-file="<path to .env>" scripts/build.mjs
```

- Never ask for the key itself, and never read, print or copy the `.env` file. Node loads it, so the key reaches the provider without passing through the conversation. If the build says the key is missing, tell the user which name it looks for.
- `kokoro` needs no `.env` file. Install it in the video project first: `npm i -E kokoro-js@1.2.1 && TTS=kokoro node scripts/build.mjs`. The package and the model take about 500 MB in the project's `node_modules`, and step 11 deletes them with it.
- The script makes one take per beat and voices again only the beats whose narration changed. A later `node scripts/build.mjs` without `TTS` keeps the voiced audio.
- `VOICE_ID=…` and `MODEL_ID=…` before the command replace the voice and the model. ElevenLabs takes a voice ID, the others a voice name from the provider's documentation.
- When running unattended, use `kokoro`, and no voice if it fails to install.

## 3. Anything else

Azure, Amazon Polly, another local model such as Piper, or macOS `say`. Generate one file per beat from that beat's narration text (without the `# title` line) and save it as `beats/NN.mp3`. Write any other format outside `beats/`, because the build reads another `NN.*` file there as a second possible visual and stops, and convert it: `mkdir -p out && say -o out/NN.aiff "<narration>" && ffmpeg -y -i out/NN.aiff beats/NN.mp3`.

## 4. No voice

Keep the silent placeholder audio from the draft pass. The captions carry the narration, so the video still works for reading at your own pace. Tell the user it is silent and that they can add a voice later by rebuilding with `TTS`, or by adding `beats/NN.mp3` files.
