import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { HandwritingStyle } from "../types";
import {
  drawLineSpec,
  drawNotebookBackground,
  PAPER_HEIGHT,
  PAPER_WIDTH,
} from "../utils/notebookDrawCore";
import { buildPagedAnimation } from "../utils/notebookLayout";
import "./AnimatedNotebookWriter.css";

const MS_PER_WORD = 48;
const MAX_ANIMATION_MS = 8000;

interface Props {
  text: string;
  style: HandwritingStyle;
  onComplete: (imageUrls: string[]) => void;
}

export default function AnimatedNotebookWriter({ text, style, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWriting, setIsWriting] = useState(true);
  const [pageInfo, setPageInfo] = useState<{ page: number; total: number } | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      await document.fonts.ready;
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = PAPER_WIDTH * dpr;
      canvas.height = PAPER_HEIGHT * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "auto";

      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);

      const pages = buildPagedAnimation(text, style);
      setPageInfo({ page: 1, total: pages.length });

      const imageUrls: string[] = [];

      // Total steps across pages to keep animation fast but bounded.
      const totalSteps = Math.max(1, pages.reduce((acc, p) => acc + p.steps.length, 0));
      const msPerStep = Math.min(MS_PER_WORD, MAX_ANIMATION_MS / totalSteps);

      const drawFrame = (stepIndex: number, pageIndex: number) => {
        drawNotebookBackground(ctx);
        const step = pages[pageIndex]!.steps[stepIndex]!;
        for (const line of step.completedLines) drawLineSpec(ctx, line);
        if (step.activeLine) drawLineSpec(ctx, step.activeLine);
      };

      let pageIndex = 0;
      let stepIndex = 0;
      drawFrame(stepIndex, pageIndex);

      const tick = () => {
        if (cancelled) return;

        stepIndex++;
        if (stepIndex < pages[pageIndex]!.steps.length) {
          drawFrame(stepIndex, pageIndex);
          timer = setTimeout(tick, msPerStep);
          return;
        }

        // Finished this page.
        imageUrls.push(canvas.toDataURL("image/png"));
        pageIndex++;
        if (pageIndex < pages.length) {
          setPageInfo({ page: pageIndex + 1, total: pages.length });
          stepIndex = 0;
          drawFrame(stepIndex, pageIndex);
          timer = setTimeout(tick, msPerStep);
          return;
        }

        setIsWriting(false);
        onCompleteRef.current(imageUrls);
      };

      timer = setTimeout(tick, msPerStep);
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [text, style]);

  return (
    <motion.div
      className="animated-notebook"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <canvas ref={canvasRef} className="animated-notebook__canvas" />
      {isWriting && (
        <motion.p
          className="animated-notebook__status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-live="polite"
        >
          Writing{pageInfo ? `… (${pageInfo.page}/${pageInfo.total})` : "…"}
        </motion.p>
      )}
    </motion.div>
  );
}
