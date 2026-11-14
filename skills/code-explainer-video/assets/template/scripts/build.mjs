// Turns beats/NN.{txt,<code ext>,diagram.json,chart.json} into public/beats/ (audio, visuals, manifest.json).
// Usage: node scripts/build.mjs, or to voice the beats: TTS=<provider> node --env-file=<path to .env> scripts/build.mjs
// Audio per beat, first match wins: beats/NN.mp3 (e.g. from an ElevenLabs MCP server),
// the provider that TTS names (see PROVIDERS), or silent placeholder audio at ~150 wpm.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "beats";
const OUT = "public/beats";
const STATE = `${OUT}/audio.json`; // per beat: where its audio came from, and the narration it was made for
const FPS = 30; // as in src/Root.tsx
const TAIL = 0.6; // seconds of pause after each beat, so the viewer can read
const { TTS, VOICE_ID, MODEL_ID } = process.env;
mkdirSync(OUT, { recursive: true });
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};
// The repository and commit a video about a codebase describes, written in step 2. A concept video has none.
const commit = existsSync("commit.txt") ? readFileSync("commit.txt", "utf8").trim() : "";

// Mistakes stop the build before any audio is made, with one line that says what to fix.
const stop = (message) => {
  console.error(message);
  process.exit(1);
};
const fail = (id, message) => stop(`Beat ${id}: ${message}`);

// The text-to-speech providers TTS can name. A hosted one takes its key from the environment, which `node --env-file=<path>` fills
// from the user's .env file, so the key never passes through the agent. kokoro is a local model from Hugging Face.
// Each turns one beat's narration into mp3, with its own voice and model unless VOICE_ID and MODEL_ID name others.
const post = async (url, headers, body) => {
  const res = await fetch(url, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${TTS} answered ${res.status} ${await res.text()}`);
  return res;
};
const bytes = async (res) => Buffer.from(await res.arrayBuffer());
// Constant bitrate, so that ffprobe measures the length of audio that came through a pipe.
const mp3 = (audio, ...format) =>
  execFileSync("ffmpeg", ["-v", "error", ...format, "-i", "pipe:0", "-b:a", "64k", "-f", "mp3", "pipe:1"], { input: audio, maxBuffer: Infinity });
let kokoro;
const PROVIDERS = {
  elevenlabs: {
    key: "ELEVENLABS_API_KEY",
    voice: "JBFqnCBsd6RMkjVDRZzb", // George
    model: "eleven_multilingual_v2",
    speak: async (text, i) =>
      bytes(await post(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, { "xi-api-key": key }, {
        text, model_id: model, previous_text: beats[i - 1]?.text, next_text: beats[i + 1]?.text,
      })),
  },
  openai: {
    key: "OPENAI_API_KEY",
    voice: "cedar",
    model: "gpt-4o-mini-tts",
    speak: async (text) =>
      bytes(await post("https://api.openai.com/v1/audio/speech", { Authorization: `Bearer ${key}` }, { model, voice, input: text })),
  },
  google: {
    key: "GEMINI_API_KEY",
    voice: "Charon",
    model: "gemini-3.8-flash-tts",
    speak: async (text) => {
      const res = await post("https://generativelanguage.googleapis.com/v1beta/interactions", { "x-goog-api-key": key }, {
        model,
        input: [{ type: "user_input", content: [{ type: "text", text, annotations: [{ type: "speech_metadata", style: "calm and clear" }] }] }],
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice }] },
      });
      const { steps } = await res.json();
      return mp3(Buffer.from(steps.flatMap((step) => step.content ?? []).findLast((part) => part.type === "audio").data, "base64"));
    },
  },
  kokoro: {
    voice: "af_heart",
    model: "onnx-community/Kokoro-82M-v1.0-ONNX",
    // One sentence at a time: the model cuts off text longer than about 25 seconds.
    speak: async (text) => {
      kokoro ??= (await import("kokoro-js")).KokoroTTS.from_pretrained(model, { dtype: "q8", device: "cpu" });
      const parts = [];
      for (const sentence of text.split(/(?<=[.!?])\s+/)) {
        const { audio } = await (await kokoro).generate(sentence, { voice });
        parts.push(Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength));
      }
      return mp3(Buffer.concat(parts), "-f", "f32le", "-ar", "24000");
    },
  },
};
const tts = PROVIDERS[TTS];
if (TTS && !tts) stop(`TTS=${TTS} is not one of: ${Object.keys(PROVIDERS).join(", ")}`);
const key = process.env[tts?.key];
if (tts?.key && !key) stop(`TTS=${TTS} needs ${tts.key}: node --env-file=<path to .env> scripts/build.mjs`);
const voice = VOICE_ID ?? tts?.voice;
const model = MODEL_ID ?? tts?.model;

const files = readdirSync(SRC).filter((f) => !f.startsWith(".")); // skip .DS_Store and the like
const ids = [...new Set(files.map((f) => f.split(".")[0]))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const beats = ids.map((id) => {
  const visuals = files.filter((f) => f.startsWith(`${id}.`) && !/\.(txt|mp3)$/.test(f));
  const visual = visuals[0];
  if (!files.includes(`${id}.txt`)) fail(id, `${id}.txt is missing`);
  if (!visual) fail(id, `its visual is missing: ${id}.<code ext>, ${id}.diagram.json or ${id}.chart.json`);
  if (visuals.length > 1) fail(id, `it has more than one visual: ${visuals.join(", ")}`);
  const [first, ...rest] = readFileSync(`${SRC}/${id}.txt`, "utf8").trim().split("\n");
  const hasTitle = first.startsWith("# ");
  // One space between words, so captions and highlights are timed from the same text.
  const text = (hasTitle ? rest : [first, ...rest]).join(" ").replace(/\s+/g, " ").trim();
  const said = text.split(/(?<=[.!?])\s+/).length; // sentences, as in src/figure.ts
  const source = readFileSync(`${SRC}/${visual}`, "utf8");
  if (/\.(diagram|chart)\.json$/.test(visual)) {
    const { nodes, data, edges: calls = [], errors = [], focus = [] } = JSON.parse(source);
    const edges = [...calls, ...errors];
    const unknown = [...edges.flatMap(([from, to]) => [from, to]), ...focus.flat()].find((key) => key !== null && !(key in (nodes ?? data)));
    if (unknown) fail(id, `"${unknown}" is not in its ${nodes ? "nodes" : "data"}`);
    const loop = edges.find(([from, to]) => from === to);
    if (loop) fail(id, `"${loop[0]}" has an edge to itself`);
    if (focus.length > said) fail(id, `focus has ${focus.length} entries but the narration has ${said} sentences`);
  } else {
    if (commit && !hasTitle) fail(id, "a code beat needs a first line '# path/to/file:lines'");
    // The sentences a mark is lit during, as in src/annotations/Mark.tsx: `!mark(1:2) 3` or `!error 2-3 Type: message`.
    const marks = source.matchAll(/!(?:mark|error)(?:\([^)]*\)|\[[^\]]*\])?[ \t]+(\d+)(?:-(\d+))?(?=\s|$)/g);
    const [off] = [...marks].find(([, from, to = from]) => from < 1 || to > said || to - from < 0) ?? [];
    if (off) fail(id, `"${off}" is not within sentences 1 to ${said} of the narration`);
  }

  // Where the audio comes from. Without TTS, audio it voiced earlier is kept as long as its narration holds.
  const given = `${SRC}/${id}.mp3`;
  const was = state[id];
  const from = existsSync(given)
    ? `file ${createHash("sha256").update(readFileSync(given)).digest("hex")}`
    : tts ? `api ${TTS} ${voice} ${model}` : was?.from.startsWith("api ") ? was.from : "silent";
  const stale = was?.from === from && was.text !== text;
  if (stale && from.startsWith("file ")) fail(id, `the narration changed but ${given} did not; re-voice it or delete it`);
  if (stale && !tts && from.startsWith("api ")) fail(id, `the narration changed since it was voiced; run the build with TTS again, or add ${given}`);
  return { id, title: hasTitle ? first.slice(2) : "", text, visual, given, from, fresh: was?.from === from && !stale };
});

const silence = (beat) => {
  const seconds = beat.text.split(" ").length / 2.5;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", `${seconds}`, `${OUT}/${beat.id}.mp3`]);
};

const duration = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]));

const manifest = [];
for (const [i, beat] of beats.entries()) {
  // Make audio only when its source or narration changed, to save credits. Remember it at once, so a failure later keeps it.
  if (!beat.fresh) {
    if (beat.from.startsWith("file ")) copyFileSync(beat.given, `${OUT}/${beat.id}.mp3`);
    else if (beat.from.startsWith("api ")) writeFileSync(`${OUT}/${beat.id}.mp3`, await tts.speak(beat.text, i).catch((error) => fail(beat.id, error.message)));
    else silence(beat);
    state[beat.id] = { from: beat.from, text: beat.text };
    writeFileSync(STATE, JSON.stringify(state, null, 2));
  }
  copyFileSync(`${SRC}/${beat.visual}`, `${OUT}/${beat.visual}`);
  const seconds = duration(`${OUT}/${beat.id}.mp3`);
  manifest.push({ id: beat.id, title: beat.title, text: beat.text, file: beat.visual, seconds, frames: Math.ceil((seconds + TAIL) * FPS) });
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
writeFileSync(`${OUT}/commit.txt`, commit);

let frame = 0;
for (const beat of manifest) console.log(`${beat.id}  frames ${frame}-${(frame += beat.frames) - 1}  ${beat.file}`);
console.log(`${manifest.length} beats, ${(frame / FPS).toFixed(1)}s of video`);
const shown = new Set(manifest.filter((beat) => !beat.file.endsWith(".json")).map((beat) => beat.title));
if (commit) console.log(`Code shown from ${commit}: ${[...shown].join(", ")}`);
