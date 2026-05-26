import type { HandwritingStyle } from "../types";
import {
  buildLineSpec,
  buildWrappedLines,
  drawLineSpec,
  drawNotebookBackground,
  isPastPageBottom,
  PAPER_HEIGHT,
  PAPER_WIDTH,
} from "./notebookDrawCore";

export interface NotebookOptions {
  text: string;
  style: HandwritingStyle;
}

export async function renderNotebookImage(options: NotebookOptions): Promise<string> {
  const { text, style } = options;

  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = PAPER_WIDTH;
  canvas.height = PAPER_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  drawNotebookBackground(ctx);

  const wrapped = buildWrappedLines(text, style);
  let lineIndex = 0;

  for (const { line: pl, text: lineText } of wrapped) {
    if (isPastPageBottom(lineIndex)) break;

    if (!lineText) {
      lineIndex++;
      continue;
    }

    drawLineSpec(ctx, buildLineSpec(pl, lineText, lineIndex, style));
    lineIndex++;
  }

  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename = "notebook-notes.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
