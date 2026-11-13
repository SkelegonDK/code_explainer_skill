import { getThemeColors, Theme as Syntax } from "@code-hike/lighter";
import React from "react";
import { z } from "zod";

// A theme's colours: background, text, keywords, strings and numbers, functions and types, the highlight (`hot`)
// for marks, diagram nodes and chart values in focus, and `err` for `!error` and error edges.
type Palette = { bg: string; fg: string; kw: string; str: string; fn: string; hot: string; err: string };

const palettes = {
  // Dark
  grape: { bg: "#433455", fg: "#F2F5D5", kw: "#DDEA78", str: "#F4C9D6", fn: "#BEE3F8", hot: "#DDEA78", err: "#FF7A85" },
  "french-blue": { bg: "#213F95", fg: "#EAF8F0", kw: "#A1E1BC", str: "#FFD58A", fn: "#C9D6FF", hot: "#A1E1BC", err: "#FF8A80" },
  espresso: { bg: "#3E2723", fg: "#F7E9E4", kw: "#F4C9D6", str: "#E6C38A", fn: "#BFD8C2", hot: "#F4C9D6", err: "#FF7B6B" },
  onyx: { bg: "#0A0A0A", fg: "#E5E4E2", kw: "#8FA6B8", str: "#C9C2A8", fn: "#FFFFFF", hot: "#8FA6B8", err: "#E5736B" },
  "black-cherry": { bg: "#550003", fg: "#F2ECCB", kw: "#E0D794", str: "#D4C55A", fn: "#F2ECCB", hot: "#E0D794", err: "#FF8A7A" },
  indigo: { bg: "#4B0082", fg: "#FFEDE5", kw: "#FE865B", str: "#FF8CC6", fn: "#FFD1A8", hot: "#FE865B", err: "#FF5C7A" },
  // Light
  butter: { bg: "#F3D98F", fg: "#3D1F2A", kw: "#B02E58", str: "#7A4B00", fn: "#5B2A86", hot: "#B02E58", err: "#C21F1F" },
  lavender: { bg: "#F6E3E5", fg: "#1B2A55", kw: "#213F95", str: "#8A3B54", fn: "#2F6B5A", hot: "#213F95", err: "#B3261E" },
  snow: { bg: "#FAFBFD", fg: "#1E1A2E", kw: "#AA0003", str: "#5B4B9A", fn: "#1E1A2E", hot: "#6B5CA5", err: "#AA0003" },
  papaya: { bg: "#FFEDD5", fg: "#2A2F45", kw: "#1F65C8", str: "#C2362F", fn: "#7A3FA0", hot: "#1F65C8", err: "#C2362F" },
} satisfies Record<string, Palette>;

export type Theme = "monokai" | keyof typeof palettes;
export const themeSchema = z.enum(["monokai", ...Object.keys(palettes)] as [Theme, ...Theme[]]);

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgb = (hex: string) => channels(hex).join(", "); // "r, g, b", for rgba()
const mix = (a: string, b: string, t: number) => // as hex, the only form lighter reads
  `#${channels(a).map((c, i) => Math.round(t * c + (1 - t) * channels(b)[i]).toString(16).padStart(2, "0")).join("")}`;

// The syntax theme Code Hike highlights with: monokai, or one made from a palette.
export const syntax = (theme: Theme): Syntax => {
  if (theme === "monokai") return theme;
  const { bg, fg, kw, str, fn } = palettes[theme];
  const scopes = (scope: string[], foreground: string, fontStyle?: string) => ({ scope, settings: { foreground, fontStyle } });
  return {
    name: theme,
    colors: { "editor.background": bg, "editor.foreground": fg },
    tokenColors: [
      scopes(["comment", "punctuation.definition.comment"], mix(fg, bg, 0.6), "italic"),
      scopes(["keyword", "storage", "variable.language", "constant.language"], kw),
      scopes(["string", "constant.numeric", "constant.character"], str),
      scopes(["entity.name.function", "support.function", "entity.name.type", "entity.name.class", "support.class", "support.type"], fn),
    ],
  };
};

export const getColors = async (theme: Theme) => {
  const { hot, err } = theme === "monokai" ? { hot: "#FACC15", err: "#F85149" } : palettes[theme];
  return { ...(await getThemeColors(syntax(theme))), hot: rgb(hot), err: rgb(err) };
};
export type ThemeColors = Awaited<ReturnType<typeof getColors>>;

const ThemeColorsContext = React.createContext<ThemeColors | null>(null);

export const useThemeColors = () => {
  const themeColors = React.useContext(ThemeColorsContext);
  if (!themeColors) throw new Error("ThemeColorsContext not found");
  return themeColors;
};

export const ThemeProvider = ({ children, themeColors }: { readonly children: React.ReactNode; readonly themeColors: ThemeColors }) => (
  <ThemeColorsContext.Provider value={themeColors}>{children}</ThemeColorsContext.Provider>
);
