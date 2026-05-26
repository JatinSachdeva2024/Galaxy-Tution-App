import type { HandwritingStyle } from "../types";
import {
  buildLineSpec,
  buildWrappedLines,
  isPastPageBottom,
  type LineDrawSpec,
} from "./notebookDrawCore";

export interface AnimationStep {
  completedLines: LineDrawSpec[];
  activeLine: LineDrawSpec | null;
}

export function buildAnimationSteps(text: string, style: HandwritingStyle): AnimationStep[] {
  const wrapped = buildWrappedLines(text, style);
  const steps: AnimationStep[] = [];
  const completedLines: LineDrawSpec[] = [];
  let lineIndex = 0;

  for (const { line: pl, text: lineText } of wrapped) {
    if (isPastPageBottom(lineIndex)) break;

    if (!lineText) {
      lineIndex++;
      continue;
    }

    const words = lineText.split(/\s+/).filter(Boolean);
    let partial = "";

    for (const word of words) {
      partial = partial ? `${partial} ${word}` : word;
      steps.push({
        completedLines: [...completedLines],
        activeLine: buildLineSpec(pl, partial, lineIndex, style, lineText),
      });
    }

    completedLines.push(buildLineSpec(pl, lineText, lineIndex, style));
    steps.push({
      completedLines: [...completedLines],
      activeLine: null,
    });

    lineIndex++;
  }

  if (steps.length === 0) {
    steps.push({ completedLines: [], activeLine: null });
  }

  return steps;
}
