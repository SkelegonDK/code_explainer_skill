import { useThemeColors } from "./calculate-metadata/theme";
import { Figure, STAGGER, useFigure } from "./figure";
import { Cues } from "./Sounds";
import { CHAR, fontFamily, fontSize, useBox } from "./font";

// beats/NN.chart.json. One series, measured from zero. `unit` is appended to each value as written.
// The file also names its `source`, which is for the fact-checker and is not drawn.
export type Chart = Figure & { type: "bar" | "line"; data: Record<string, number>; unit?: string };

const WIDTH = 1500; // the widest the plot gets
const HEIGHT = 520; // of the plot: values sit above it and names below
const SLOT = 300; // the widest one bar's or point's share of the width gets
const LOW = 6; // the least height of a bar, so a bar of 0 can still be highlighted

export const Chart: React.FC<{ chart: Chart; prev: Chart | null; text: string; seconds: number }> = ({ chart, prev, text, seconds }) => {
  const names = Object.keys(chart.data);
  const { appear, cues, heat, tone } = useFigure(chart, prev, names.length, text, seconds);
  const { hot } = useThemeColors();
  const isLine = chart.type === "line";
  const slot = Math.min(SLOT, Math.min(WIDTH, useBox().width) / names.length);
  const width = slot * names.length;
  const bar = slot / 3;
  const max = Math.max(...Object.values(chart.data)) || 1; // all zero: draw at the baseline
  const values = names.map((name) => `${chart.data[name].toLocaleString("en-US")}${chart.unit ?? ""}`);
  // Each row of text shrinks, all alike, until its longest entry fits one slot, so none is clipped or overlaps.
  const fit = (texts: string[], size: number) => Math.min(size, (slot - 16) / (CHAR * Math.max(...texts.map((t) => t.length))));

  // A bar grows from the baseline. A point on a line fades in where it belongs.
  const points = names.map((name, i) => {
    const shown = appear(i * STAGGER);
    const high = (HEIGHT * chart.data[name]) / max;
    return { name, shown, x: (i + 0.5) * slot, y: HEIGHT - (isLine ? high : Math.max(LOW, high) * shown) };
  });
  const mark = ({ x, y, shown }: (typeof points)[number], fill: string, opacity: number) =>
    isLine ? (
      <circle cx={x} cy={y} r={12} fill={fill} stroke={tone(0)} strokeWidth={4} opacity={opacity * shown} />
    ) : (
      <rect x={x - bar / 2} y={y} width={bar} height={HEIGHT - y} rx={6} fill={fill} opacity={opacity} />
    );
  // Every bar shows its value. A line shows only its two ends and the point in focus.
  const valued = (name: string, i: number) => (isLine && i % (names.length - 1) ? heat(name) : 1);

  return (
    <>
      <Cues cues={cues()} />
      <svg width={width} height={HEIGHT + 150} viewBox={`0 -70 ${width} ${HEIGHT + 150}`} style={{ margin: "auto", fontFamily }} fontSize={fontSize} textAnchor="middle">
        {isLine && points.slice(1).map((p, i) => (
          <path key={p.name} d={`M${points[i].x},${points[i].y} L${p.x},${p.y}`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p.shown} stroke={tone(0.45)} strokeWidth={4} strokeLinecap="round" />
        ))}
        {points.map((p, i) => (
          <g key={p.name}>
            {mark(p, tone(0.45), 1)}
            {mark(p, `rgb(${hot})`, heat(p.name))}
            <text x={p.x} y={p.y - 28} opacity={p.shown * valued(p.name, i)} fill="currentColor" stroke={tone(0)} strokeWidth={10} paintOrder="stroke" fontSize={fit(values, fontSize)}>
              {values[i]}
            </text>
            <text x={p.x} y={HEIGHT + 52} opacity={p.shown} fill={tone(0.75)} fontSize={fit(names, 28)}>
              {p.name}
            </text>
          </g>
        ))}
        <path d={`M0,${HEIGHT} H${width}`} stroke={tone(0.3)} strokeWidth={2} />
      </svg>
    </>
  );
};
