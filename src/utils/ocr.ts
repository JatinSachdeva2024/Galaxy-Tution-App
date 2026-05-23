import { createWorker, PSM, type Line, type Page } from "tesseract.js";

const MIN_LINE_CONFIDENCE = 68;
const MIN_WORD_CONFIDENCE = 62;
const MAX_IMAGE_DIM = 2200;

/** Boost contrast so OCR targets ink/text, not background texture */
async function preprocessForTextScan(source: File | string): Promise<string> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);

  try {
    const img = await loadImage(url);
    let { width, height } = img;

    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    for (let i = 0; i < data.length; i += 4) {
      const gray =
        0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const contrast = (gray - 128) * 1.35 + 128;
      const boosted = Math.max(0, Math.min(255, contrast));
      data[i] = data[i + 1] = data[i + 2] = boosted;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
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

function alnumRatio(text: string): number {
  if (!text.length) return 0;
  const alnum = text.match(/[\p{L}\p{N}]/gu);
  return (alnum?.length ?? 0) / text.length;
}

function isNoiseToken(token: string): boolean {
  const t = token.trim();
  if (!t) return true;
  if (t.length === 1 && !/[\p{L}\p{N}]/u.test(t)) return true;
  if (/^[^\p{L}\p{N}\s]+$/u.test(t) && t.length >= 2) return true;
  if (t.length >= 3 && alnumRatio(t) < 0.35) return true;
  return false;
}

function isNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (t.length >= 4 && alnumRatio(t) < 0.45) return true;
  if (/^(.)\1{4,}$/.test(t.replace(/\s/g, ""))) return true;
  return false;
}

function lineFromWords(line: Line): string {
  return line.words
    .filter((w) => w.confidence >= MIN_WORD_CONFIDENCE && !isNoiseToken(w.text))
    .map((w) => w.text.trim())
    .filter(Boolean)
    .join(" ");
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

function extractReadableText(page: Page): string {
  const rawLines = collectLines(page);
  const kept: string[] = [];

  for (const line of rawLines) {
    const wordBuilt = lineFromWords(line);
    const candidate =
      wordBuilt.length > 0
        ? wordBuilt
        : line.confidence >= MIN_LINE_CONFIDENCE
          ? line.text.trim()
          : "";

    if (!candidate || isNoiseLine(candidate)) continue;
    if (line.confidence < MIN_LINE_CONFIDENCE && wordBuilt.length === 0) continue;

    kept.push(candidate);
  }

  const merged: string[] = [];
  for (const line of kept) {
    const norm = line.replace(/\s{2,}/g, " ").trim();
    if (!norm || merged[merged.length - 1] === norm) continue;
    merged.push(norm);
  }

  return merged.join("\n").trim();
}

export async function extractTextFromImage(
  imageSource: string | File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const prepared = await preprocessForTextScan(imageSource);

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

    const { data } = await worker.recognize(prepared);
    return extractReadableText(data);
  } finally {
    await worker.terminate();
  }
}
