// Turns beats/NN.{txt,<code ext>,mmd} into public/beats/ (audio, visuals, manifest.json).
// Usage: ELEVENLABS_API_KEY=... VOICE_ID=... node scripts/build.mjs
// Audio per beat, first match wins: beats/NN.mp3 (e.g. from the ElevenLabs connector),
// the ElevenLabs API (ELEVENLABS_API_KEY + VOICE_ID), or silent placeholder audio at ~150 wpm.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "beats";
const OUT = "public/beats";
const { ELEVENLABS_API_KEY: KEY, VOICE_ID, MODEL_ID = "eleven_multilingual_v2" } = process.env;
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC);
const ids = [...new Set(files.map((f) => f.split(".")[0]))].sort();
const beats = ids.map((id) => {
  const [first, ...rest] = readFileSync(`${SRC}/${id}.txt`, "utf8").trim().split("\n");
  const hasTitle = first.startsWith("# ");
  const visual = files.find((f) => f.startsWith(`${id}.`) && !/\.(txt|mp3)$/.test(f));
  return {
    id,
    title: hasTitle ? first.slice(2) : "",
    text: (hasTitle ? rest : [first, ...rest]).join(" ").trim(),
    lang: visual.split(".").pop(),
    visual,
  };
});

const speak = async (beat, i) => {
  if (!KEY) {
    const seconds = beat.text.split(/\s+/).length / 2.5;
    execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", `${seconds}`, `${OUT}/${beat.id}.mp3`]);
    return;
  }
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
  // Re-voice only when the narration changed (or a placeholder is being replaced), to save credits.
  const given = `${SRC}/${beat.id}.mp3`;
  const stamp = `${OUT}/${beat.id}.txt`;
  const said = `${KEY ? "voice" : "silent"}:${beat.text}`;
  if (existsSync(given)) {
    copyFileSync(given, `${OUT}/${beat.id}.mp3`);
  } else if (!existsSync(stamp) || readFileSync(stamp, "utf8") !== said) {
    await speak(beat, i);
    writeFileSync(stamp, said);
  }
  const isDiagram = beat.lang === "mmd";
  const file = isDiagram ? `${beat.id}.svg` : beat.visual;
  if (isDiagram) {
    execFileSync("mmdc", ["-q", "-i", `${SRC}/${beat.visual}`, "-o", `${OUT}/${file}`, "-t", "dark", "-b", "transparent"]);
  } else {
    copyFileSync(`${SRC}/${beat.visual}`, `${OUT}/${file}`);
  }
  manifest.push({ id: beat.id, title: beat.title, text: beat.text, kind: isDiagram ? "diagram" : "code", file, seconds: duration(`${OUT}/${beat.id}.mp3`) });
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`${manifest.length} beats, ${manifest.reduce((s, b) => s + b.seconds, 0).toFixed(1)}s of narration`);
