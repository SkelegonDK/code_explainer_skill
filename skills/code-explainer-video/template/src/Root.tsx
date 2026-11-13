import { Composition } from "remotion";
import { Main } from "./Main";
import { calculateMetadata } from "./calculate-metadata/calculate-metadata";
import { schema } from "./calculate-metadata/schema";

export const RemotionRoot = () => (
  <Composition
    id="Main"
    component={Main}
    defaultProps={{ steps: null, themeColors: null, theme: "monokai" as const, format: "16:9" as const }}
    fps={30}
    calculateMetadata={calculateMetadata}
    schema={schema}
  />
);
