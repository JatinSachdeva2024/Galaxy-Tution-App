import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { HandwritingStyle } from "../types";
import {
  drawLineSpec,
  drawNotebookBackground,
  PAPER_HEIGHT,
  PAPER_WIDTH,
} from "../utils/notebookDrawCore";
import { buildAnimationSteps } from "../utils/notebookLayout";
import "./AnimatedNotebookWriter.css";

const MS_PER_WORD = 48;
const MAX_ANIMATION_MS = 8000;

interface Props {
  text: string;
  style: HandwritingStyle;
  onComplete: (imageUrl: string) => void;
}

export default function AnimatedNotebookWriter({ text, style, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWriting, setIsWriting] = useState(true);
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

      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = PAPER_WIDTH;
      bgCanvas.height = PAPER_HEIGHT;
      drawNotebookBackground(bgCanvas.getContext("2d")!);

      const steps = buildAnimationSteps(text, style);
      const totalWords = Math.max(1, steps.length);
      const msPerStep = Math.min(MS_PER_WORD, MAX_ANIMATION_MS / totalWords);

      const drawStep = (index: number) => {
        ctx.drawImage(bgCanvas, 0, 0);
        const step = steps[index];
        for (const line of step.completedLines) {
          drawLineSpec(ctx, line);
        }
        if (step.activeLine) {
          drawLineSpec(ctx, step.activeLine);
        }
      };

      let i = 0;
      drawStep(0);

      const tick = () => {
        if (cancelled) return;
        i++;
        if (i < steps.length) {
          drawStep(i);
          timer = setTimeout(tick, msPerStep);
        } else {
          setIsWriting(false);
          onCompleteRef.current(canvas.toDataURL("image/png"));
        }
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
          Writing…
        </motion.p>
      )}
    </motion.div>
  );
}
