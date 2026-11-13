import { z } from "zod";
import { themeSchema } from "./theme";

const format = z.enum(["16:9", "9:16", "4:5", "1:1"]);
export const schema = z.object({ theme: themeSchema, format, music: z.boolean(), sounds: z.boolean() });

export const frames: Record<z.infer<typeof format>, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
};
