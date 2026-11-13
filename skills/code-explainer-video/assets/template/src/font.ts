import { loadFont } from "@remotion/google-fonts/RobotoMono";
import { useMemo } from "react";
import { useVideoConfig } from "remotion";

export const { fontFamily } = loadFont("normal", { subsets: ["latin"], weights: ["400", "700"] });
export const fontSize = 32; // of diagrams and charts; code is sized to fit, in src/CodeTransition.tsx
export const tabSize = 3;
export const CHAR = 0.6; // width of a Roboto Mono character, in em

// Where a visual goes: the frame minus a side padding of 5% of its width, and the top padding, title and captions.
export const useBox = () => {
  const { width, height } = useVideoConfig();
  return useMemo(() => ({ pad: width / 20, width: 0.9 * width, height: height - 320 }), [width, height]);
};
