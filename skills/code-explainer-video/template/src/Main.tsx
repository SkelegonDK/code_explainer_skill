import { Audio } from "@remotion/media";
import { HighlightedCode } from "codehike/code";
import { AbsoluteFill, Series, staticFile } from "remotion";
import { Captions } from "./Captions";
import { Chart } from "./Chart";
import { CodeTransition } from "./CodeTransition";
import { Diagram, Graph } from "./Diagram";
import { ThemeColors, ThemeProvider } from "./calculate-metadata/theme";
import { Beat } from "./calculate-metadata/get-files";
import { fontFamily, useBox } from "./font";

export type Step = Beat & { code: HighlightedCode | null; graph: Graph | null; chart: Chart | null };
export type Props = { steps: Step[] | null; themeColors: ThemeColors | null };

const titleStyle: React.CSSProperties = { fontFamily, fontSize: 28, opacity: 0.6, height: 40 };

export const Main: React.FC<Props> = ({ steps, themeColors }) => {
  const { pad } = useBox();
  if (!steps || !themeColors) throw new Error("Run calculateMetadata first");
  // The bottom padding keeps the captions clear, so a visual is centred in the room above them.
  const beatStyle: React.CSSProperties = { flexDirection: "column", padding: `48px ${pad}px 148px`, gap: 24 };
  return (
    <ThemeProvider themeColors={themeColors}>
      <AbsoluteFill style={{ backgroundColor: themeColors.background, color: themeColors.foreground }}>
        <Series>
          {steps.map((step, i) => (
            <Series.Sequence key={step.id} durationInFrames={step.frames} name={step.id} premountFor={30} style={beatStyle}>
              <Audio src={staticFile(`beats/${step.id}.mp3`)} />
              <div style={titleStyle}>{step.title}</div>
              {step.code && <CodeTransition prev={steps[i - 1]} newCode={step.code} text={step.text} seconds={step.seconds} />}
              {step.graph && <Diagram graph={step.graph} prev={steps[i - 1]?.graph ?? null} text={step.text} seconds={step.seconds} />}
              {step.chart && <Chart chart={step.chart} prev={steps[i - 1]?.chart ?? null} text={step.text} seconds={step.seconds} />}
              <Captions text={step.text} seconds={step.seconds} />
            </Series.Sequence>
          ))}
        </Series>
      </AbsoluteFill>
    </ThemeProvider>
  );
};
