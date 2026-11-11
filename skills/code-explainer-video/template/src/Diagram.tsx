import { Graph as Dagre, layout, Point } from "@dagrejs/dagre";
import { useMemo } from "react";
import { HOT } from "./annotations/Mark";
import { Figure, STAGGER, useFigure } from "./figure";
import { fontFamily, fontSize } from "./font";

// beats/NN.diagram.json. `nodes` maps an id to its label; an edge is [from, to, label].
export type Graph = Figure & { nodes: Record<string, string>; edges: [string, string, string?][] };

const BOX = { width: 1728, height: 760 }; // the frame minus padding, title and captions
const CHAR = 0.6; // width of a Roboto Mono character, in em
const LABEL = 24; // edge label font size

const arrange = (graph: Graph, rankdir: "LR" | "TB") => {
  const g = new Dagre().setGraph({ rankdir, nodesep: 48, ranksep: 72 });
  Object.entries(graph.nodes).forEach(([id, label]) =>
    g.setNode(id, { width: label.length * CHAR * fontSize + 64, height: 2.5 * fontSize }),
  );
  graph.edges.forEach(([from, to, label = ""]) =>
    g.setEdge(from, to, { width: label.length * CHAR * LABEL + 16, height: label ? 2 * LABEL : 0, labelpos: "c" }),
  );
  layout(g);
  const { width, height } = g.graph();
  return { g, width, height, scale: Math.min(1.5, BOX.width / width, BOX.height / height) };
};

// A smooth line through dagre's points: a curve around each inner point, straight into the last one.
const curve = ([first, ...rest]: Point[]) =>
  rest.reduce((d, p, i) => {
    const next = rest[i + 1];
    return next ? `${d}Q${p.x},${p.y} ${(p.x + next.x) / 2},${(p.y + next.y) / 2}` : `${d}L${p.x},${p.y}`;
  }, `M${first.x},${first.y}`);

export const Diagram: React.FC<{ graph: Graph; prev: Graph | null; text: string; seconds: number }> = ({ graph, prev, text, seconds }) => {
  const ids = Object.keys(graph.nodes);
  const { appear, heat, tone } = useFigure(graph, prev, ids.length, text, seconds);

  // Left-to-right unless top-down fits the frame at a larger scale.
  const { g, width, height, scale } = useMemo(() => {
    const [across, down] = (["LR", "TB"] as const).map((dir) => arrange(graph, dir));
    return down.scale > across.scale ? down : across;
  }, [graph]);

  return (
    <svg width={width * scale} height={height * scale} viewBox={`0 0 ${width} ${height}`} style={{ margin: "auto", overflow: "visible", fontFamily }}>
      {graph.edges.map(([from, to, label], i) => {
        const { points, x, y } = g.edge(from, to);
        const drawn = appear((Math.max(ids.indexOf(from), ids.indexOf(to)) + 2) * STAGGER); // once both its ends are in
        const [tail, tip] = points.slice(-2);
        const angle = (Math.atan2(tip.y - tail.y, tip.x - tail.x) * 180) / Math.PI;
        const line = { fill: "none", stroke: tone(0.5), strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
        return (
          <g key={i}>
            <path d={curve(points)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawn} {...line} />
            <path d="M-14,-8 L0,0 L-14,8" transform={`translate(${tip.x} ${tip.y}) rotate(${angle})`} opacity={drawn ** 4} {...line} />
            <text x={x} y={y} opacity={drawn} fontSize={LABEL} fill={tone(0.75)} stroke={tone(0)} strokeWidth={12} paintOrder="stroke" textAnchor="middle" dominantBaseline="central">
              {label}
            </text>
          </g>
        );
      })}
      {ids.map((id, i) => {
        const { x, y, width: w, height: h } = g.node(id);
        const shown = appear(i * STAGGER);
        const box = { x: -w / 2, y: -h / 2, width: w, height: h, rx: 16 };
        return (
          <g key={id} opacity={shown} transform={`translate(${x} ${y}) scale(${0.9 + 0.1 * shown})`}>
            <rect {...box} fill={tone(0.07)} stroke={tone(0.3)} strokeWidth={2} />
            <rect {...box} fill={`rgba(${HOT}, 0.14)`} stroke={`rgb(${HOT})`} strokeWidth={4} opacity={heat(id)} />
            <text fontSize={fontSize} fill="currentColor" textAnchor="middle" dominantBaseline="central">
              {graph.nodes[id]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
