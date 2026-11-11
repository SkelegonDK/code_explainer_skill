# Narration

Use one voice for the whole video, and for every chapter of a long one. Take the first option that is available. Every option produces `beats/NN.mp3`, or audio that `scripts/build.mjs` generates, so nothing else in the pipeline changes.

## 1. ElevenLabs connector (preferred, no API key)

1. `creative_create_flow` once for the video.
2. Pick a calm, clear narrator with `creative_list_voices` (use case `informative_educational`), unless the user named a voice.
3. Per beat, call `creative_generate_speech` with that `flow_id` and `voice_id`, the beat's narration as `prompt`, and model `eleven_v4`.
4. It returns at once. Wait about 10 s, then call `creative_get_generations` with the first pending `generation_id` and download its `full_res_url`: `curl -sSf -o beats/NN.mp3 "<url>"`.

Each call makes two takes and charges for both. Tell the user the credit cost before voicing more than about 10 beats. Never repeat a generate call to retry, because it charges again.

## 2. ElevenLabs API key

Ask for `ELEVENLABS_API_KEY` once and never write it to a file. Get a voice ID with `curl -s -H "xi-api-key: $ELEVENLABS_API_KEY" https://api.elevenlabs.io/v1/voices`, then run:

```bash
ELEVENLABS_API_KEY=… VOICE_ID=… node scripts/build.mjs
```

The script makes one take per beat, and it sends the neighbouring beats' text so that intonation carries across beats. It re-voices only beats whose narration changed. `MODEL_ID` overrides the default model, `eleven_multilingual_v2`.

## 3. Another text-to-speech provider

OpenAI, Google Cloud, Azure, Amazon Polly, a local model such as Kokoro or Piper, or macOS `say -o beats/NN.aiff "<narration>"`. Generate one file per beat from that beat's narration text (without the `# title` line) and save it as `beats/NN.mp3`. Convert other formats with `ffmpeg -i in.wav beats/NN.mp3`.

## 4. No voice

Keep the silent placeholder audio from the draft pass. The captions carry the narration, so the video still works for reading at your own pace. Tell the user it is silent and that they can add a voice later by replacing `beats/NN.mp3` and rebuilding.
