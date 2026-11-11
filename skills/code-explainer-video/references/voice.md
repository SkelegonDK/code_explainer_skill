# Narration

Use one voice for the whole video, and for every chapter of a long one. Take the first option that is available. Every option produces `beats/NN.mp3`, or audio that `scripts/build.mjs` generates, so nothing else in the pipeline changes. Use one option for the whole video too: the connector uses `eleven_v4` and the API key path `eleven_multilingual_v2` by default, so mixing them changes how beats sound.

## 1. ElevenLabs connector (preferred, no API key)

1. `creative_create_flow` once for the video.
2. Pick a calm, clear narrator with `creative_list_voices` (use case `informative_educational`), unless the user named a voice.
3. Price the video before voicing it: make one call as in step 4, with the whole narration as `prompt` and `estimate_only: true`, which returns the cost and generates nothing. For scale, about 150 words in 7 beats cost roughly 750 to 950 credits per take on `eleven_v4`. Tell the user the total and wait for a yes before voicing more than about 10 beats.
4. Per beat, call `creative_generate_speech` with `prompt` (the beat's narration, without the `# title` line), `model_id: "eleven_v4"`, the `voice_id`, the `flow_id`, `generations_count: 1` and a short `context`. The default is two takes, which doubles the cost, and the video uses only one. The call returns at once with `flow_id`, `node_id` and `session_ids`.
5. Call `creative_get_flow_run_status` with the `flow_id` and `session_ids` until `all_completed` or `has_failures` is true, waiting `poll_after_seconds` between calls. If your agent cannot run a plain `sleep`, do other work between calls, such as downloading a finished beat. Then download the take's `content_url`: `curl -sSf -o beats/NN.mp3 "<content_url>"`.

Voice one beat first and compare its length with its words ÷ 2.5: if the voice is more than 10% slower, cut words from the other beats before voicing them, because voices differ in pace. Keep only a few generations running at once and start the next as one finishes: starting many at once fails with a concurrency-limit error. Never repeat a generate call to retry, because it charges again.

## 2. ElevenLabs API key

Ask for `ELEVENLABS_API_KEY` once and never write it to a file. Get a voice ID with `curl -s -H "xi-api-key: $ELEVENLABS_API_KEY" https://api.elevenlabs.io/v1/voices`, then run:

```bash
ELEVENLABS_API_KEY=… VOICE_ID=… node scripts/build.mjs
```

The script makes one take per beat, and it sends the neighbouring beats' text so that intonation carries across beats. It re-voices only beats whose narration changed. `MODEL_ID` overrides the default model, `eleven_multilingual_v2`.

## 3. Another text-to-speech provider

OpenAI, Google Cloud, Azure, Amazon Polly, a local model such as Kokoro or Piper, or macOS `say`. Generate one file per beat from that beat's narration text (without the `# title` line) and save it as `beats/NN.mp3`. Write any other format outside `beats/`, because the build reads another `NN.*` file there as a second possible visual and stops, and convert it: `mkdir -p out && say -o out/NN.aiff "<narration>" && ffmpeg -y -i out/NN.aiff beats/NN.mp3`.

## 4. No voice

Keep the silent placeholder audio from the draft pass. The captions carry the narration, so the video still works for reading at your own pace. Tell the user it is silent and that they can add a voice later by adding `beats/NN.mp3` files and rebuilding.
