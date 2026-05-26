import type { HandwritingStyle } from "../types";
import {
  buildLineSpec,
  buildWrappedLines,
  drawLineSpec,
  drawNotebookBackground,
  LINES_PER_PAGE,
  PAPER_HEIGHT,
  PAPER_WIDTH,
} from "./notebookDrawCore";

export interface NotebookOptions {
  text: string;
  style: HandwritingStyle;
}

export async function renderNotebookImages(options: NotebookOptions): Promise<string[]> {
  const { text, style } = options;

  await document.fonts.ready;

  const wrapped = buildWrappedLines(text, style);
  const pages: string[] = [];

  let pageLineIndex = 0;
  let canvas = document.createElement("canvas");
  canvas.width = PAPER_WIDTH;
  canvas.height = PAPER_HEIGHT;
  let ctx = canvas.getContext("2d")!;
  drawNotebookBackground(ctx);

  const newPage = () => {
    pages.push(canvas.toDataURL("image/png"));
    canvas = document.createElement("canvas");
    canvas.width = PAPER_WIDTH;
    canvas.height = PAPER_HEIGHT;
    ctx = canvas.getContext("2d")!;
    drawNotebookBackground(ctx);
    pageLineIndex = 0;
  };

  for (const { line: pl, text: lineText } of wrapped) {
    if (pageLineIndex >= LINES_PER_PAGE) {
      newPage();
    }

    if (!lineText) {
      pageLineIndex++;
      continue;
    }

    drawLineSpec(ctx, buildLineSpec(pl, lineText, pageLineIndex, style));
    pageLineIndex++;
  }

  pages.push(canvas.toDataURL("image/png"));
  return pages;
}

export async function renderNotebookImage(options: NotebookOptions): Promise<string> {
  const pages = await renderNotebookImages(options);
  return pages[0] ?? "";
}

export function downloadDataUrl(dataUrl: string, filename = "notebook-notes.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function downloadAllDataUrls(dataUrls: string[], baseName = "notebook-notes") {
  dataUrls.forEach((url, idx) => {
    const filename =
      dataUrls.length === 1 ? `${baseName}.png` : `${baseName}-page-${idx + 1}.png`;
    downloadDataUrl(url, filename);
  });
}
