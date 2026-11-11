// Turns beats/NN.{txt,<code ext>,diagram.json,chart.json} into public/beats/ (audio, visuals, manifest.json).
// Usage: ELEVENLABS_API_KEY=... VOICE_ID=... node scripts/build.mjs
// Audio per beat, first match wins: beats/NN.mp3 (e.g. from the ElevenLabs connector),
// the ElevenLabs API (ELEVENLABS_API_KEY + VOICE_ID), or silent placeholder audio at ~150 wpm.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "beats";
const OUT = "public/beats";
const STATE = `${OUT}/audio.json`; // per beat: where its audio came from, and the narration it was made for
const FPS = 30; // as in src/Root.tsx
const TAIL = 0.6; // seconds of pause after each beat, so the viewer can read
const { ELEVENLABS_API_KEY: KEY, VOICE_ID, MODEL_ID = "eleven_multilingual_v2" } = process.env;
mkdirSync(OUT, { recursive: true });
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {};

// Mistakes stop the build before any audio is made, with one line that says what to fix.
const stop = (message) => {
  console.error(message);
  process.exit(1);
};
const fail = (id, message) => stop(`Beat ${id}: ${message}`);
if (KEY && !VOICE_ID) stop("Set VOICE_ID together with ELEVENLABS_API_KEY");

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
  if (/\.(diagram|chart)\.json$/.test(visual)) {
    const { nodes, data, edges = [], focus = [] } = JSON.parse(readFileSync(`${SRC}/${visual}`, "utf8"));
    const unknown = [...edges.flatMap(([from, to]) => [from, to]), ...focus.flat()].find((key) => key !== null && !(key in (nodes ?? data)));
    if (unknown) fail(id, `"${unknown}" is not in its ${nodes ? "nodes" : "data"}`);
    const loop = edges.find(([from, to]) => from === to);
    if (loop) fail(id, `"${loop[0]}" has an edge to itself`);
    const said = text.split(/(?<=[.!?])\s+/).length; // sentences, as in src/figure.ts
    if (focus.length > said) fail(id, `focus has ${focus.length} entries but the narration has ${said} sentences`);
  }

  // Where the audio comes from. Without a key, audio voiced through the API is kept as long as its narration holds.
  const given = `${SRC}/${id}.mp3`;
  const was = state[id];
  const from = existsSync(given)
    ? `file ${createHash("sha256").update(readFileSync(given)).digest("hex")}`
    : KEY ? `api ${VOICE_ID} ${MODEL_ID}` : was?.from.startsWith("api ") ? was.from : "silent";
  const stale = was?.from === from && was.text !== text;
  if (stale && from.startsWith("file ")) fail(id, `the narration changed but ${given} did not; re-voice it or delete it`);
  if (stale && !KEY && from.startsWith("api ")) fail(id, `the narration changed since it was voiced; set ELEVENLABS_API_KEY and VOICE_ID, or add ${given}`);
  return { id, title: hasTitle ? first.slice(2) : "", text, visual, given, from, fresh: was?.from === from && !stale };
});

const silence = (beat) => {
  const seconds = beat.text.split(" ").length / 2.5;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", `${seconds}`, `${OUT}/${beat.id}.mp3`]);
};

const speak = async (beat, i) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: beat.text,
      model_id: MODEL_ID,
      previous_text: beats[i - 1]?.text,
      next_text: beats[i + 1]?.text,
    }),
  });
  if (!res.ok) throw new Error(`Beat ${beat.id}: ElevenLabs ${res.status} ${await res.text()}`);
  writeFileSync(`${OUT}/${beat.id}.mp3`, Buffer.from(await res.arrayBuffer()));
};

const duration = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]));

const manifest = [];
for (const [i, beat] of beats.entries()) {
  // Make audio only when its source or narration changed, to save credits. Remember it at once, so a failure later keeps it.
  if (!beat.fresh) {
    if (beat.from.startsWith("file ")) copyFileSync(beat.given, `${OUT}/${beat.id}.mp3`);
    else if (beat.from.startsWith("api ")) await speak(beat, i);
    else silence(beat);
    state[beat.id] = { from: beat.from, text: beat.text };
    writeFileSync(STATE, JSON.stringify(state, null, 2));
  }
  copyFileSync(`${SRC}/${beat.visual}`, `${OUT}/${beat.visual}`);
  const seconds = duration(`${OUT}/${beat.id}.mp3`);
  manifest.push({ id: beat.id, title: beat.title, text: beat.text, file: beat.visual, seconds, frames: Math.ceil((seconds + TAIL) * FPS) });
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));

let frame = 0;
for (const beat of manifest) console.log(`${beat.id}  frames ${frame}-${(frame += beat.frames) - 1}  ${beat.file}`);
console.log(`${manifest.length} beats, ${(frame / FPS).toFixed(1)}s of video`);
