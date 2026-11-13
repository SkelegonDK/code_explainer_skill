import { AnnotationHandler, CodeAnnotation, HighlightedCode, Pre } from "codehike/code";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Easing, interpolate, useCurrentFrame, useDelayRender } from "remotion";

import {
  calculateTransitions,
  getStartingSnapshot,
  TokenTransitionsSnapshot,
} from "codehike/utils/token-transitions";
import { line, lit, mark, Marks, PAD, rows } from "./annotations/Mark";
import { sentences, useCue } from "./figure";
import type { Step } from "./Main";
import { applyStyle } from "./utils";

import { tokenTransitions } from "./annotations/InlineToken";
import { CHAR, fontFamily, tabSize, useBox } from "./font";

const MAX = 80; // px, the largest the code gets

// The largest font at which the code fits the box: its longest row across, with a character to spare so that
// no label wraps, and every row down. At the limits of an excerpt for the format (SKILL.md), it is about 32 px.
const fit = (code: HighlightedCode, box: { width: number; height: number }) => {
  const all = rows(code).map((row) => row.replace(/\t/g, " ".repeat(tabSize)));
  const widest = Math.max(...all.map((row) => row.length)) + 1;
  return Math.min(MAX, (box.width - 2 * PAD) / (CHAR * widest), box.height / (1.5 * all.length));
};

export function CodeTransition({
  prev,
  newCode,
  text,
  seconds,
  durationInFrames = 30,
}: {
  readonly prev?: Step;
  readonly newCode: HighlightedCode;
  readonly text: string;
  readonly seconds: number;
  readonly durationInFrames?: number;
}) {
  const frame = useCurrentFrame();
  const box = useBox();
  const oldCode = prev?.code ?? null;

  const ref = React.useRef<HTMLPreElement>(null);
  const [oldSnapshot, setOldSnapshot] =
    useState<TokenTransitionsSnapshot | null>(null);
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = React.useState(() => delayRender());

  const prevCode: HighlightedCode = useMemo(() => {
    return oldCode || { ...newCode, tokens: [], annotations: [] };
  }, [newCode, oldCode]);

  const code = useMemo(() => {
    return oldSnapshot ? newCode : prevCode;
  }, [newCode, prevCode, oldSnapshot]);

  useEffect(() => {
    if (!oldSnapshot) {
      setOldSnapshot(getStartingSnapshot(ref.current!));
    }
  }, [oldSnapshot]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!oldSnapshot) {
      setOldSnapshot(getStartingSnapshot(ref.current!));
      return;
    }
    const transitions = calculateTransitions(ref.current!, oldSnapshot);
    transitions.forEach(({ element, keyframes, options }) => {
      const delay = durationInFrames * options.delay;
      const duration = durationInFrames * options.duration;
      const linearProgress = interpolate(
        frame,
        [delay, delay + duration],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
      const progress = interpolate(linearProgress, [0, 1], [0, 1], {
        easing: Easing.bezier(0.17, 0.67, 0.76, 0.91),
      });

      applyStyle({
        element,
        keyframes,
        progress,
        linearProgress,
      });
    });
    continueRender(handle);
  });

  const handlers: AnnotationHandler[] = useMemo(() => {
    return [tokenTransitions, line, mark];
  }, []);

  // The marks move after the code has. When the previous beat showed the same rows, nothing moves, and the marks
  // move at once from the ones that beat ended on: they are lit during sentence 0, the start of this beat.
  const still = oldCode && String(rows(oldCode)) === String(rows(newCode));
  const ended = still ? oldCode.annotations.filter((a) => lit(a, sentences(prev?.text ?? "").length - 1)) : null;
  const cue = useCue(text, seconds, ended ? 0 : durationInFrames);
  const marks = {
    all: [...(ended ?? []).map((a) => ({ ...a, query: "0" })), ...code.annotations],
    heat: (a: CodeAnnotation) => cue.heat((k) => lit(a, k)),
  };

  // The font grows or shrinks from the previous code's size while the code moves.
  // The auto margin centres the code in the frame, as wide as its longest row, like a diagram.
  const from = fit(oldCode ?? newCode, box);
  const fontSize = interpolate(frame, [0, durationInFrames], [from, oldSnapshot ? fit(newCode, box) : from], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const style: React.CSSProperties = { position: "relative", margin: "auto", fontSize, lineHeight: 1.5, fontFamily, tabSize };

  return (
    <Marks.Provider value={marks}>
      <Pre ref={ref} code={code} handlers={handlers} style={style} />
    </Marks.Provider>
  );
}
