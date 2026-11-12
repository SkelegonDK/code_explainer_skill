import { AnnotationHandler, CodeAnnotation, HighlightedCode, InnerLine } from "codehike/code";
import { createContext, useContext } from "react";

export const HOT = "250, 204, 21"; // the highlight colour for code and diagram nodes
export const ERR = "248, 81, 73"; // the colour of code that throws and of diagram error edges
const DIM = 0.4; // the opacity of the lines no mark is on, while a mark is lit
export const PAD = 22; // px on each side of every line, inside the band

// `// !mark` (next line), `// !mark(1:3)` (next three lines) or `// !mark[/regex/]` (part of the next line).
// `!error` is the same in red, for the code that throws. Both take `<sentences> <label>`, each optional:
// `2` is lit during sentence 2 of the narration, `2-3` during sentences 2 to 3, and without a number during all of them.
// The label shows under the mark's last line while it is lit. Sentence 0 is the start of the beat, before anything is said.
const read = (query: string) => {
  const [head, from, to = from] = query.match(/^(\d+)(?:-(\d+))?(?:\s+|$)/) ?? [""];
  return { from: Number(from ?? 1), to: Number(to ?? Infinity), label: query.slice(head.length) };
};

// Whether a mark is lit during sentence `k`, counted from 0.
export const lit = ({ query }: CodeAnnotation, k: number) => read(query).from <= k + 1 && k < read(query).to;

// Every mark of the code on screen, and how lit each one is now, from 0 to 1.
export const Marks = createContext<{ all: CodeAnnotation[]; heat: (a: CodeAnnotation) => number }>({ all: [], heat: () => 0 });

const rgb = (a: CodeAnnotation) => (a.name === "error" ? ERR : HOT);
const lines = (a: CodeAnnotation) => ("lineNumber" in a ? [a.lineNumber, a.lineNumber] : [a.fromLineNumber, a.toLineNumber]);

// The rows the code takes on screen: its lines, and each label, indented like the line it sits under.
export const rows = ({ code, annotations }: HighlightedCode) => {
  const text = code.split("\n");
  const labelled = annotations.filter((a) => read(a.query).label);
  return [...text, ...labelled.map((a) => text[lines(a)[1] - 1].match(/^\s*/)![0] + read(a.query).label)];
};

// Every line: a band when a mark of whole lines is on it, its labels under it, and dimmed while the marks are elsewhere.
// No annotation has this name, so Code Hike renders each line through it once, however many marks are on the line.
export const line: AnnotationHandler = {
  name: "line",
  Line: (props) => {
    const { all, heat } = useContext(Marks);
    const sum = (marks: CodeAnnotation[]) => Math.min(1, marks.reduce((total, a) => total + heat(a), 0));
    const here = all.filter((a) => lines(a)[0] <= props.lineNumber && props.lineNumber <= lines(a)[1]);
    const band = sum(here.filter((a) => !("lineNumber" in a)));
    const colour = here.some((a) => a.name === "error" && heat(a)) ? ERR : HOT;
    return (
      <div
        style={{
          opacity: 1 - (1 - DIM) * (sum(all) - sum(here)),
          boxShadow: `inset 6px 0 0 rgba(${colour}, ${band})`,
          backgroundColor: `rgba(${colour}, ${band * 0.14})`,
          padding: `0 ${PAD}px`,
        }}
      >
        <InnerLine merge={props} />
        {here
          .filter((a) => lines(a)[1] === props.lineNumber && read(a.query).label)
          .map((a, i) => (
            // The span keeps the code transition, which fades in every element without children, off the label's opacity.
            <div key={i} style={{ opacity: heat(a), color: `rgb(${rgb(a)})`, paddingLeft: `${props.indentation}ch`, whiteSpace: "pre-wrap" }}>
              <span>{read(a.query).label}</span>
            </div>
          ))}
      </div>
    );
  },
};

// Part of a line: a box around it.
export const mark: AnnotationHandler = {
  name: "mark",
  Inline: ({ annotation, children }) => {
    const on = useContext(Marks).heat(annotation) * 0.3;
    return <span style={{ borderRadius: 6, backgroundColor: `rgba(${HOT}, ${on})`, boxShadow: `0 0 0 4px rgba(${HOT}, ${on})` }}>{children}</span>;
  },
};
