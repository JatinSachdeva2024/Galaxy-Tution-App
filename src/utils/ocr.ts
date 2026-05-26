import { createWorker, PSM, type Line, type Page } from "tesseract.js";

/** Word confidence floor — kept low so real photos still pass */
const MIN_WORD_CONFIDENCE = 35;
const MIN_LINE_CONFIDENCE = 40;

type LangSpec = "eng" | "eng+hin";

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

function countReadableChars(text: string): number {
  const m = text.match(/[\p{L}\p{N}]/gu);
  return m?.length ?? 0;
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

function postProcessExamText(text: string): string {
  // Normalizes common “MCQ/exam screenshot” OCR artifacts:
  // - Standalone "10." lines separated from the question line
  // - Extra blank lines between every small segment
  // - Non-text artifacts like checkmarks
  const rawLines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\s{2,}/g, " ").trim());

  const lines = rawLines.filter((l) => {
    if (!l) return true; // keep blanks for now; we'll collapse later
    // Drop obvious non-text tokens like a lone checkmark box.
    if (/^[✓✔☑✅]+$/.test(l)) return false;
    return true;
  });

  const out: string[] = [];
  const pendingNums: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line) {
      out.push("");
      continue;
    }

    const isQNumOnly = /^\d{1,3}\.$/.test(line);
    const looksLikeOption = /^[a-d]\)\s+/i.test(line);
    const alreadyHasNum = /^\d{1,3}\.\s+/.test(line);

    // Collect stacked numbers like:
    // 10.
    // 11.
    // 12.
    // then attach them one-by-one to subsequent question lines.
    if (isQNumOnly) {
      pendingNums.push(line);
      continue;
    }

    // If the OCR already included the number, reset pending queue.
    if (alreadyHasNum) {
      pendingNums.length = 0;
      out.push(line);
      continue;
    }

    // Attach a pending question number to the next non-option content line.
    if (!looksLikeOption && pendingNums.length > 0) {
      const n = pendingNums.shift()!;
      out.push(`${n} ${line}`);
      continue;
    }

    out.push(line);
  }

  // If numbers were detected but we never found lines to attach them to,
  // append them (rare, but better than losing data).
  for (const n of pendingNums) out.push(n);

  // Collapse excessive blank lines (keep at most one).
  const collapsed: string[] = [];
  for (const l of out) {
    if (!l && collapsed[collapsed.length - 1] === "") continue;
    collapsed.push(l);
  }

  return collapsed.join("\n").trim();
}

async function preprocessVariants(source: File | string): Promise<(File | string)[]> {
  // Provide both original and binarized variants.
  const prepared: (File | string)[] = [source];
  try {
    prepared.push(await binarizeForText(source));
  } catch {
    // If preprocessing fails for any reason, keep going with original.
  }
  return prepared;
}

async function binarizeForText(source: File | string): Promise<string> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const img = await loadImage(url);
    const maxDim = 2200;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const { data } = imageData;

    // Convert to grayscale first.
    const gray = new Uint8ClampedArray(w * h);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      gray[p] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
    }

    // Compute Otsu threshold.
    const hist = new Uint32Array(256);
    for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
    const total = gray.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];

    let sumB = 0;
    let wB = 0;
    let varMax = -1;
    let threshold = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      const wF = total - wB;
      if (wF === 0) break;
      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > varMax) {
        varMax = between;
        threshold = t;
      }
    }

    // Apply light contrast boost + threshold.
    for (let p = 0; p < gray.length; p++) {
      const g = Math.max(0, Math.min(255, (gray[p] - 128) * 1.15 + 128));
      const v = g < threshold ? 0 : 255;
      const i = p * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}

async function recognizeWith(workerLang: LangSpec, input: File | string, psm: PSM, onProgress?: (pct: number) => void) {
  const worker = await createWorker(workerLang, 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round((m.progress ?? 0) * 100));
      }
    },
  });
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: psm,
    });
    const { data } = await worker.recognize(input, {}, { text: true, blocks: true });
    const best = pickBestResult(data);
    return { text: best, page: data };
  } finally {
    await worker.terminate();
  }
}

export async function extractTextFromImage(
  imageSource: string | File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const upscaled = await upscaleIfSmall(imageSource);
  const inputs = await preprocessVariants(upscaled);

  // Try a few fast combos first with English.
  const attempts: { lang: LangSpec; psm: PSM }[] = [
    { lang: "eng", psm: PSM.AUTO },
    { lang: "eng", psm: PSM.SINGLE_BLOCK },
    { lang: "eng", psm: PSM.SPARSE_TEXT },
  ];

  let bestText = "";
  let bestScore = -1;

  for (const input of inputs) {
    for (const a of attempts) {
      const result = await recognizeWith(a.lang, input, a.psm, onProgress);
      const score = countReadableChars(result.text);
      if (score > bestScore) {
        bestScore = score;
        bestText = result.text;
      }
      // Good enough: stop early.
      if (bestScore >= 80) return postProcessExamText(bestText);
    }
  }

  // If the result is still weak and user’s content may include Hindi/Devanagari,
  // retry with eng+hin (better for mixed notes).
  if (bestScore < 15) {
    const hinAttempts: { lang: LangSpec; psm: PSM }[] = [
      { lang: "eng+hin", psm: PSM.AUTO },
      { lang: "eng+hin", psm: PSM.SINGLE_BLOCK },
    ];

    for (const input of inputs) {
      for (const a of hinAttempts) {
        const result = await recognizeWith(a.lang, input, a.psm, onProgress);
        const score = countReadableChars(result.text);
        if (score > bestScore) {
          bestScore = score;
          bestText = result.text;
        }
        if (bestScore >= 80) return postProcessExamText(bestText);
      }
    }
  }

  return postProcessExamText(bestText);
}
