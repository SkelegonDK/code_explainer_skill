import { useCurrentFrame, useVideoConfig } from "remotion";
import { sentences } from "./figure";
import { CHAR, fontFamily, useBox } from "./font";

const SIZE = 34; // px
const PADDING = 24; // px on each side

// Split each sentence into captions of at most `budget` characters, breaking early after `,` `;` or `:` once a caption
// has 3+ words and 3+ words remain. A sentence's last caption takes words from the one before until it has 3.
const split = (sentence: string, budget: number) => {
  const words = sentence.split(" ");
  const out = words.reduce<string[][]>(
    (out, word, i) => {
      const last = out[out.length - 1];
      const pause = last.length >= 3 && /[,;:]$/.test(last[last.length - 1]) && words.length - i >= 3;
      if (last.length && (pause || [...last, word].join(" ").length > budget)) out.push([]);
      out[out.length - 1].push(word);
      return out;
    },
    [[]],
  );
  const [before, tail] = out.slice(-2);
  while (tail && tail.length < 3 && before.length > 3) tail.unshift(before.pop()!);
  return out.map((c) => c.join(" "));
};

const style: React.CSSProperties = {
  position: "absolute",
  bottom: 40,
  left: "50%",
  transform: "translateX(-50%)",
  width: "max-content", // without it, left: 50% caps the width at half the frame
  padding: `10px ${PADDING}px`,
  borderRadius: 10,
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  color: "white",
  fontFamily,
  fontSize: SIZE,
  textAlign: "center",
};

// Chunks are timed in proportion to their length across the beat's audio.
export const Captions: React.FC<{ text: string; seconds: number }> = ({ text, seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // The caption box is at most 1500 px wide, and holds one line with a character to spare: 70 characters in 16:9.
  const maxWidth = Math.min(1500, useBox().width);
  const budget = Math.floor((maxWidth - 2 * PADDING) / (CHAR * SIZE)) - 1;
  const parts = sentences(text).flatMap((s) => split(s, budget));
  const total = parts.join(" ").length;
  let start = 0;
  const current = parts.filter((p) => {
    const at = (start / total) * seconds * fps;
    start += p.length + 1;
    return frame >= at;
  }).pop();
  return <div style={{ ...style, maxWidth }}>{current}</div>;
};
