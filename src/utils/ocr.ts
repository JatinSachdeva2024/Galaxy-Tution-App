import { createWorker } from "tesseract.js";

export async function extractTextFromImage(
  imageSource: string | File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round((m.progress ?? 0) * 100));
      }
    },
  });

  try {
    const { data } = await worker.recognize(imageSource);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}
