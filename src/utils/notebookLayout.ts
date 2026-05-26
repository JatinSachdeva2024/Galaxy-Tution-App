import type { HandwritingStyle } from "../types";
import {
  buildLineSpec,
  buildWrappedLines,
  LINES_PER_PAGE,
  type LineDrawSpec,
} from "./notebookDrawCore";

export interface AnimationStep {
  completedLines: LineDrawSpec[];
  activeLine: LineDrawSpec | null;
}

export interface PageAnimation {
  steps: AnimationStep[];
}

export function buildPagedAnimation(text: string, style: HandwritingStyle): PageAnimation[] {
  const wrapped = buildWrappedLines(text, style);
  const pages: PageAnimation[] = [];

  let pageCompleted: LineDrawSpec[] = [];
  let pageSteps: AnimationStep[] = [];

  let pageLineIndex = 0;

  const flushPage = () => {
    if (pageSteps.length === 0) return;
    pages.push({ steps: pageSteps });
    pageCompleted = [];
    pageSteps = [];
    pageLineIndex = 0;
  };

  for (const { line: pl, text: lineText } of wrapped) {
    // New page when we hit the max line slots.
    if (pageLineIndex >= LINES_PER_PAGE) {
      flushPage();
    }

    if (!lineText) {
      pageLineIndex++;
      continue;
    }

    const words = lineText.split(/\s+/).filter(Boolean);
    let partial = "";

    for (const word of words) {
      partial = partial ? `${partial} ${word}` : word;
      pageSteps.push({
        completedLines: [...pageCompleted],
        activeLine: buildLineSpec(pl, partial, pageLineIndex, style, lineText),
      });
    }

    pageCompleted.push(buildLineSpec(pl, lineText, pageLineIndex, style));
    pageSteps.push({
      completedLines: [...pageCompleted],
      activeLine: null,
    });

    pageLineIndex++;
  }

  flushPage();
  if (pages.length === 0) {
    pages.push({ steps: [{ completedLines: [], activeLine: null }] });
  }

  return pages;
}
