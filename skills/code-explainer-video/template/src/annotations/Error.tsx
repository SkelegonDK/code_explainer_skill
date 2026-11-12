import { AnnotationHandler } from "codehike/code";
import { interpolate, useCurrentFrame } from "remotion";

export const ERR = "248, 81, 73"; // the colour of code that throws and of diagram error edges

// `// !error(1:2) TypeError: id is undefined` marks the lines that throw and shows the error under them.
// It fades in after `!mark`, so a marked condition reads first and the throw it leads to second.
export const error: AnnotationHandler = {
  name: "error",
  Block: ({ annotation, children }) => {
    const opacity = interpolate(useCurrentFrame(), [45, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <div style={{ boxShadow: `inset 6px 0 0 rgba(${ERR}, ${opacity})`, backgroundColor: `rgba(${ERR}, ${opacity * 0.14})` }}>
        {children}
        {annotation.query && (
          <div style={{ opacity, color: `rgb(${ERR})`, padding: "4px 22px 8px", whiteSpace: "pre-wrap" }}>{annotation.query}</div>
        )}
      </div>
    );
  },
};
