import { staticFile } from "remotion";

export type Beat = { id: string; title: string; text: string; kind: "code" | "diagram"; file: string; seconds: number };

export const getBeats = async (): Promise<Beat[]> => (await fetch(staticFile("beats/manifest.json"))).json();
export const getText = async (file: string) => (await fetch(staticFile(`beats/${file}`))).text();
