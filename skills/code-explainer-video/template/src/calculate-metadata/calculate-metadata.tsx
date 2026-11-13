import { getThemeColors } from "@code-hike/lighter";
import { highlight } from "codehike/code";
import { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { Props } from "../Main";
import { getBeats, getText } from "./get-files";
import { frames, schema } from "./schema";

export const calculateMetadata: CalculateMetadataFunction<Props & z.infer<typeof schema>> = async ({ props }) => {
  const steps = await Promise.all(
    (await getBeats()).map(async (beat) => {
      const source = await getText(beat.file);
      const [, kind] = beat.file.match(/\.(diagram|chart)\.json$/) ?? [];
      return {
        ...beat,
        graph: kind === "diagram" ? JSON.parse(source) : null,
        chart: kind === "chart" ? JSON.parse(source) : null,
        code: kind ? null : await highlight({ value: source.trimEnd(), lang: beat.file.split(".").pop()!, meta: "" }, props.theme),
      };
    }),
  );
  return {
    ...frames[props.format],
    durationInFrames: steps.reduce((sum, s) => sum + s.frames, 0),
    props: { ...props, steps, themeColors: await getThemeColors(props.theme) },
  };
};
