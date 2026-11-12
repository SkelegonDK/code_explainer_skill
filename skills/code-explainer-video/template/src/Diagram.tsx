import { Graph as Dagre, layout, Point } from "@dagrejs/dagre";
import { useMemo } from "react";
import { ERR, HOT } from "./annotations/Mark";
import { Figure, STAGGER, useFigure } from "./figure";
import { BOX, CHAR, fontFamily, fontSize } from "./font";

// beats/NN.diagram.json. `nodes` maps an id to its label; an edge is [from, to, label].
// `errors` are edges drawn in red, from where an error is thrown to where it is caught.
type Edge = [string, string, string?];
export type Graph = Figure & { nodes: Record<string, string>; edges: Edge[]; errors?: Edge[] };

// Every edge, the error edges last, each named by its index here.
const lines = (graph: Graph) => [...graph.edges, ...(graph.errors ?? [])];

const LABEL = 24; // edge label font size

// Two lines cross when the ends of each lie on opposite sides of the other.
const side = (p: Point, q: Point, r: Point) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
const cross = ([a, b]: Point[], [c, d]: Point[]) => side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
const pieces = (points: Point[]) => points.slice(1).map((q, i) => [points[i], q]);

// A layout is clean when no straight piece of an edge, between dagre's points, crosses another piece or cuts into a box.
// A line that cuts into a box crosses one of its diagonals.
const clean = (g: Dagre) => {
  const lines = g.edges().flatMap((e) => pieces(g.edge(e).points));
  const diagonals = g.nodes().flatMap((v) => {
    const { x, y, width: w, height: h } = g.node(v);
    return [-1, 1].map((s) => [{ x: x - w / 2, y: y - (s * h) / 2 }, { x: x + w / 2, y: y + (s * h) / 2 }]);
  });
  return !lines.some((a, i) => [...lines.slice(i + 1), ...diagonals].some((b) => cross(a, b)));
};

const place = (graph: Graph, rankdir: "LR" | "TB", disableOptimalOrderHeuristic: boolean) => {
  const ids = Object.keys(graph.nodes);
  const g = new Dagre({ multigraph: true }).setGraph({ rankdir, nodesep: 48, ranksep: 72 }); // multigraph: edges between the same two nodes stay apart
  ids.forEach((id) => g.setNode(id, { width: graph.nodes[id].length * CHAR * fontSize + 64, height: 2.5 * fontSize }));
  // Edges go in by the order of their target in `nodes`, so dagre's first, depth-first ordering follows `nodes`.
  [...lines(graph).entries()].sort(([, a], [, b]) => ids.indexOf(a[1]) - ids.indexOf(b[1])).forEach(([i, [from, to, label = ""]]) =>
    g.setEdge(from, to, { width: label.length * CHAR * LABEL + 16, height: label ? 2 * LABEL : 0, labelpos: "c" }, `${i}`),
  );
  layout(g, { disableOptimalOrderHeuristic });
  return g;
};

// Siblings keep the order of `nodes` (left to right, or top to bottom) when that layout is clean.
// Otherwise dagre reorders to reduce crossings, which breaks ties between siblings in no useful order.
const arrange = (graph: Graph, rankdir: "LR" | "TB") => {
  const listed = place(graph, rankdir, true);
  const g = clean(listed) ? listed : place(graph, rankdir, false);
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
  const { appear, heat, landed, tone } = useFigure(graph, prev, ids.length, text, seconds);

  // An edge draws once both its ends are in. An error edge waits until the highlight lands on the node it leaves,
  // after the error edge before it drew, so the failure shows when the narration reaches it.
  let after = -Infinity;
  const delays = lines(graph).map(([from, to], i) => {
    const at = i < graph.edges.length ? undefined : landed(from, after);
    after = at ?? after;
    return at ?? (Math.max(ids.indexOf(from), ids.indexOf(to)) + 2) * STAGGER;
  });

  // Left-to-right unless top-down fits the frame at a larger scale.
  const { g, width, height, scale } = useMemo(() => {
    const [across, down] = (["LR", "TB"] as const).map((dir) => arrange(graph, dir));
    return down.scale > across.scale ? down : across;
  }, [graph]);

  return (
    <svg width={width * scale} height={height * scale} viewBox={`0 0 ${width} ${height}`} style={{ margin: "auto", overflow: "visible", fontFamily }}>
      {lines(graph).map(([from, to, label], i) => {
        const { points, x, y, width: w } = g.edge({ v: from, w: to, name: `${i}` });
        const drawn = appear(delays[i]);
        const [tail, tip] = points.slice(-2);
        const angle = (Math.atan2(tip.y - tail.y, tip.x - tail.x) * 180) / Math.PI;
        const red = i >= graph.edges.length;
        const line = { fill: "none", stroke: red ? `rgb(${ERR})` : tone(0.5), strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
        return (
          <g key={i}>
            <path d={curve(points)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawn} {...line} />
            <path d="M-14,-8 L0,0 L-14,8" transform={`translate(${tip.x} ${tip.y}) rotate(${angle})`} opacity={drawn ** 4} {...line} />
            {label && (
              <g opacity={drawn}>
                <rect x={x - w / 2} y={y - 0.75 * LABEL} width={w} height={1.5 * LABEL} rx={8} fill={tone(0)} />
                <text x={x} y={y} fontSize={LABEL} fill={red ? `rgb(${ERR})` : tone(0.75)} textAnchor="middle" dominantBaseline="central">
                  {label}
                </text>
              </g>
            )}
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
