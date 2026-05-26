import { motion } from "framer-motion";
import type { HandwritingStyle } from "../types";
import AnimatedNotebookWriter from "./AnimatedNotebookWriter";

interface Props {
  text: string;
  style: HandwritingStyle;
  imageUrl: string | null;
  onWritingComplete: (url: string) => void;
  onBack: () => void;
  onDownload: () => void;
  onStartOver: () => void;
}

export default function NotebookPreview({
  text,
  style,
  imageUrl,
  onWritingComplete,
  onBack,
  onDownload,
  onStartOver,
}: Props) {
  const isWriting = !imageUrl;

  return (
    <motion.div
      className="preview-panel"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <h2>Your notebook page</h2>
      <p className="muted">
        {isWriting ? "Watch your notes appear on the page…" : "Ready to download."}
      </p>

      <div className="preview-frame">
        {!imageUrl ? (
          <AnimatedNotebookWriter text={text} style={style} onComplete={onWritingComplete} />
        ) : (
          <motion.img
            src={imageUrl}
            alt="Handwritten notebook page"
            className="notebook-img"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </div>

      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={onBack} disabled={isWriting}>
          Edit text
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={onDownload}
          disabled={!imageUrl}
        >
          Download image
        </button>
      </div>

      <button type="button" className="btn ghost" onClick={onStartOver} disabled={isWriting}>
        Start over
      </button>
    </motion.div>
  );
}
