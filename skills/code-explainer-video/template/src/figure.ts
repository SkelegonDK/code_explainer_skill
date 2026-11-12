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

// Where the highlight is. `at` is the frame each sentence of the narration starts, timed like the captions, by its
// position in the text, and no earlier than `built`. `heat` is how lit something is, from 0 to 1, given the sentences
// it is lit during: the highlight sits on the last sentence reached and fades over from the one before it.
// Sentences count from 0, and -1 is the start of the beat, before the first one.
export const useCue = (text: string, seconds: number, built: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const said = sentences(text);
  const at = said.map((_, k) => Math.max(built, (said.slice(0, k).join(" ").length / text.length) * seconds * fps));
  const now = at.filter((start) => frame >= start).length - 1;
  const moved = Math.min(1, (frame - (at[now] ?? -Infinity)) / FADE);
  return { at, heat: (lit: (k: number) => boolean) => (lit(Math.max(-1, now - 1)) ? 1 - moved : 0) + (lit(now) ? moved : 0) };
};

// `appear` builds the items in, `heat` is how highlighted an item is,
// and `tone` is a shade between the background (0) and the text colour (1).
export const useFigure = (figure: Figure, prev: Figure | null, items: number, text: string, seconds: number) => {
  const frame = useCurrentFrame();
  const { background, foreground } = useThemeColors();

  // A figure carried over from the previous beat stays put; a new one builds in, items in the order listed.
  const carried = shape(figure) === shape(prev);
  const appear = (delay: number) =>
    carried ? 1 : interpolate(frame, [delay, delay + FADE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // One focus entry per sentence. A carried figure starts on the item the previous beat ended on.
  const focus = figure.focus ?? [];
  const lit = (k: number) => ids(k < 0 ? (carried ? prev?.focus?.slice(-1)[0] : null) : focus[Math.min(k, focus.length - 1)]);
  const cue = useCue(text, seconds, carried ? 0 : items * STAGGER + FADE);

  return {
    appear,
    // The frame the highlight first lands on `id` at or after frame `after`, if it does.
    landed: (id: string, after: number) => cue.at.find((start, k) => start >= after && lit(k).includes(id)),
    heat: (id: string) => cue.heat((k) => lit(k).includes(id)),
    tone: (t: number) => interpolateColors(t, [0, 1], [background, foreground]),
  };
};
