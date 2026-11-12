import { loadFont } from "@remotion/google-fonts/RobotoMono";

export const { fontFamily } = loadFont("normal", { subsets: ["latin"], weights: ["400", "700"] });
export const fontSize = 32; // of diagrams and charts; code is sized to fit, in src/CodeTransition.tsx
export const tabSize = 3;
export const CHAR = 0.6; // width of a Roboto Mono character, in em
export const BOX = { width: 1728, height: 760 }; // the frame minus padding, title and captions
