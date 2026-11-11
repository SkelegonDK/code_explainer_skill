import { getThemeColors } from "@code-hike/lighter";
import { highlight } from "codehike/code";
import { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { Props } from "../Main";
import { getBeats, getText } from "./get-files";
import { schema } from "./schema";

const TAIL_SECONDS = 0.6; // pause after each beat so the viewer can read

export const calculateMetadata: CalculateMetadataFunction<Props & z.infer<typeof schema>> = async ({ props }) => {
  const fps = 30;
  const steps = await Promise.all(
    (await getBeats()).map(async (beat) => ({
      ...beat,
      frames: Math.ceil((beat.seconds + TAIL_SECONDS) * fps),
      code:
        beat.kind === "code"
          ? await highlight({ value: await getText(beat.file), lang: beat.file.split(".").pop()!, meta: "" }, props.theme)
          : null,
    })),
  );
  return {
    fps,
    durationInFrames: steps.reduce((sum, s) => sum + s.frames, 0),
    props: { ...props, steps, themeColors: await getThemeColors(props.theme) },
  };
};
