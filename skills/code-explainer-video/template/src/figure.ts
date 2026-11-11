import { Easing, interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { useThemeColors } from "./calculate-metadata/theme";

export const STAGGER = 5; // frames between one item appearing and the next
const FADE = 12; // frames for an item to appear, and for the highlight to move

// A diagram or chart. `focus` names the item, or the list of items, to highlight during each sentence of the narration.
export type Figure = { focus?: (string | string[] | null)[] };

// A sentence ends at `.`, `!` or `?` followed by whitespace. No caption crosses one, and the highlight moves at one.
export const sentences = (text: string) => text.split(/(?<=[.!?])\s+/);

// A focus entry as a list of ids: one, several or none.
const ids = (entry?: string | string[] | null) => [entry ?? []].flat();

const shape = (figure: Figure | null) => JSON.stringify({ ...figure, focus: undefined });

// `appear` builds the items in, `heat` is how highlighted an item is,
// and `tone` is a shade between the background (0) and the text colour (1).
export const useFigure = (figure: Figure, prev: Figure | null, items: number, text: string, seconds: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { background, foreground } = useThemeColors();

  // A figure carried over from the previous beat stays put; a new one builds in, items in the order listed.
  const carried = shape(figure) === shape(prev);
  const appear = (delay: number) =>
    carried ? 1 : interpolate(frame, [delay, delay + FADE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // One cue per sentence, timed like the captions: by the sentence's position in the text.
  const focus = figure.focus ?? [];
  const built = carried ? 0 : items * STAGGER + FADE;
  const said = sentences(text);
  const cues = said.map((_, k) => ({
    ids: ids(focus[Math.min(k, focus.length - 1)]),
    at: Math.max(built, (said.slice(0, k).join(" ").length / text.length) * seconds * fps),
  }));

  // The highlight sits on the last cue reached and fades over from the one before it.
  // A carried figure starts on the item the previous beat ended on.
  const entry = { ids: carried ? ids(prev?.focus?.slice(-1)[0]) : [], at: -Infinity };
  const [before, now] = [entry, entry, ...cues].filter((cue) => frame >= cue.at).slice(-2);
  const moved = Math.min(1, (frame - now.at) / FADE);

  return {
    appear,
    heat: (id: string) => (before.ids.includes(id) ? 1 - moved : 0) + (now.ids.includes(id) ? moved : 0),
    tone: (t: number) => interpolateColors(t, [0, 1], [background, foreground]),
  };
};
