import { useCurrentFrame, useVideoConfig } from "remotion";
import { sentences } from "./figure";
import { fontFamily } from "./font";

const BUDGET = 70; // characters on one line of the caption box, at most 1500 px wide at 34 px monospace

// Split each sentence into captions of at most BUDGET characters, breaking early after `,` `;` or `:` once a caption
// has 3+ words and 3+ words remain. A sentence's last caption takes words from the one before until it has 3.
const split = (sentence: string) => {
  const words = sentence.split(" ");
  const out = words.reduce<string[][]>(
    (out, word, i) => {
      const last = out[out.length - 1];
      const pause = last.length >= 3 && /[,;:]$/.test(last[last.length - 1]) && words.length - i >= 3;
      if (last.length && (pause || [...last, word].join(" ").length > BUDGET)) out.push([]);
      out[out.length - 1].push(word);
      return out;
    },
    [[]],
  );
  const [before, tail] = out.slice(-2);
  while (tail && tail.length < 3 && before.length > 3) tail.unshift(before.pop()!);
  return out.map((c) => c.join(" "));
};

const chunk = (text: string) => sentences(text).flatMap(split);

const style: React.CSSProperties = {
  position: "absolute",
  bottom: 40,
  left: "50%",
  transform: "translateX(-50%)",
  width: "max-content", // without it, left: 50% caps the width at half the frame
  maxWidth: 1500,
  padding: "10px 24px",
  borderRadius: 10,
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  color: "white",
  fontFamily,
  fontSize: 34,
  textAlign: "center",
};

// Chunks are timed in proportion to their length across the beat's audio.
export const Captions: React.FC<{ text: string; seconds: number }> = ({ text, seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const parts = chunk(text);
  const total = parts.join(" ").length;
  let start = 0;
  const current = parts.filter((p) => {
    const at = (start / total) * seconds * fps;
    start += p.length + 1;
    return frame >= at;
  }).pop();
  return <div style={style}>{current}</div>;
};
