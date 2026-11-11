import { Audio } from "@remotion/media";
import { HighlightedCode } from "codehike/code";
import { AbsoluteFill, Img, Series, staticFile } from "remotion";
import { Captions } from "./Captions";
import { CodeTransition } from "./CodeTransition";
import { ThemeColors, ThemeProvider } from "./calculate-metadata/theme";
import { Beat } from "./calculate-metadata/get-files";
import { fontFamily } from "./font";

export type Step = Beat & { frames: number; code: HighlightedCode | null };
export type Props = { steps: Step[] | null; themeColors: ThemeColors | null };

const beatStyle: React.CSSProperties = { flexDirection: "column", padding: "48px 96px", gap: 24 };
const titleStyle: React.CSSProperties = { fontFamily, fontSize: 28, opacity: 0.6, height: 40 };

export const Main: React.FC<Props> = ({ steps, themeColors }) => {
  if (!steps || !themeColors) throw new Error("Run calculateMetadata first");
  return (
    <ThemeProvider themeColors={themeColors}>
      <AbsoluteFill style={{ backgroundColor: themeColors.background, color: themeColors.foreground }}>
        <Series>
          {steps.map((step, i) => (
            <Series.Sequence key={step.id} durationInFrames={step.frames} name={step.id} premountFor={30} style={beatStyle}>
              <Audio src={staticFile(`beats/${step.id}.mp3`)} />
              <div style={titleStyle}>{step.title}</div>
              {step.code ? (
                <CodeTransition oldCode={steps[i - 1]?.code ?? null} newCode={step.code} />
              ) : (
                <Img src={staticFile(`beats/${step.file}`)} style={{ flex: 1, minHeight: 0, width: "100%", objectFit: "contain" }} />
              )}
              <Captions text={step.text} seconds={step.seconds} />
            </Series.Sequence>
          ))}
        </Series>
      </AbsoluteFill>
    </ThemeProvider>
  );
};
