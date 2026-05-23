import { createWorker, PSM, type Line, type Page } from "tesseract.js";

/** Word confidence floor — kept low so real photos still pass */
const MIN_WORD_CONFIDENCE = 35;
const MIN_LINE_CONFIDENCE = 40;

async function upscaleIfSmall(source: File | string): Promise<File | string> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);

  try {
    const img = await loadImage(url);
    const minSide = Math.min(img.width, img.height);

    if (minSide >= 1200) {
      return source;
    }

    const scale = 1200 / minSide;
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    });

    return new File([blob], "scan.png", { type: "image/png" });
  } finally {
    if (typeof source !== "string") {
      URL.revokeObjectURL(url);
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hasReadableContent(text: string): boolean {
  return /[\p{L}\p{N}]{2,}/u.test(text);
}

function isObviousNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (t.length >= 8 && !/[\p{L}\p{N}]/u.test(t)) return true;
  return false;
}

function cleanPlainText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\s{2,}/g, " ").trim())
    .filter((line) => line && !isObviousNoiseLine(line))
    .join("\n")
    .trim();
}

function collectLines(page: Page): Line[] {
  const lines: Line[] = [];
  for (const block of page.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      lines.push(...(para.lines ?? []));
    }
  }
  return lines;
}

function extractFromBlocks(page: Page): string {
  const lines = collectLines(page);
  const kept: string[] = [];

  for (const line of lines) {
    const fromWords = line.words
      .filter((w) => w.confidence >= MIN_WORD_CONFIDENCE && w.text.trim())
      .map((w) => w.text.trim())
      .join(" ")
      .trim();

    const candidate =
      fromWords ||
      (line.confidence >= MIN_LINE_CONFIDENCE ? line.text.trim() : "");

    if (candidate && !isObviousNoiseLine(candidate)) {
      kept.push(candidate);
    }
  }

  const unique: string[] = [];
  for (const line of kept) {
    if (unique[unique.length - 1] !== line) unique.push(line);
  }

  return unique.join("\n").trim();
}

function pickBestResult(page: Page): string {
  const fromBlocks = extractFromBlocks(page);
  const fromPlain = cleanPlainText(page.text ?? "");

  if (fromBlocks.length >= fromPlain.length * 0.5 && hasReadableContent(fromBlocks)) {
    return fromBlocks;
  }
  if (hasReadableContent(fromPlain)) {
    return fromPlain;
  }
  if (fromBlocks.length > 0) {
    return fromBlocks;
  }

  return (page.text ?? "").trim();
}

export async function extractTextFromImage(
  imageSource: string | File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const input = await upscaleIfSmall(imageSource);

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round((m.progress ?? 0) * 100));
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    });

    const { data } = await worker.recognize(
      input,
      {},
      { text: true, blocks: true }
    );

    return pickBestResult(data);
  } finally {
    await worker.terminate();
  }
}
