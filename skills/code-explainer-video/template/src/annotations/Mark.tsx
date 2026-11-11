import { AnnotationHandler, InnerLine } from "codehike/code";
import { interpolate, useCurrentFrame } from "remotion";

// `// !mark` (next line) or `// !mark(3:5)`. Fades in after the 30-frame code transition.
export const mark: AnnotationHandler = {
  name: "mark",
  Line: ({ annotation, ...props }) => {
    const opacity = interpolate(useCurrentFrame(), [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const on = Boolean(annotation);
    return (
      <div
        style={{
          borderLeft: `6px solid rgba(250, 204, 21, ${on ? opacity : 0})`,
          backgroundColor: `rgba(250, 204, 21, ${on ? opacity * 0.14 : 0})`,
          paddingLeft: 16,
        }}
      >
        <InnerLine merge={props} />
      </div>
    );
  },
};
