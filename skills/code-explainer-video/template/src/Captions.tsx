import { useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "./font";

// Split narration into short chunks, breaking at punctuation once a chunk has 3+ words, or at 8 words.
const chunk = (text: string) =>
  text.split(/\s+/).reduce<string[][]>(
    (out, word) => {
      const last = out[out.length - 1];
      last.push(word);
      if (last.length >= 8 || (last.length >= 3 && /[.,;:!?]$/.test(word))) out.push([]);
      return out;
    },
    [[]],
  ).filter((c) => c.length).map((c) => c.join(" "));

const style: React.CSSProperties = {
  position: "absolute",
  bottom: 40,
  left: "50%",
  transform: "translateX(-50%)",
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
