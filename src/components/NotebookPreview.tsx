import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { HandwritingStyle } from "../types";
import AnimatedNotebookWriter from "./AnimatedNotebookWriter";

interface Props {
  text: string;
  style: HandwritingStyle;
  imageUrls: string[] | null;
  onWritingComplete: (urls: string[]) => void;
  onBack: () => void;
  onDownloadCurrent: (index: number) => void;
  onDownloadAll: () => void;
  onStartOver: () => void;
}

export default function NotebookPreview({
  text,
  style,
  imageUrls,
  onWritingComplete,
  onBack,
  onDownloadCurrent,
  onDownloadAll,
  onStartOver,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const isWriting = !imageUrls || imageUrls.length === 0;
  const totalPages = imageUrls?.length ?? 0;
  const currentUrl = useMemo(() => imageUrls?.[pageIndex] ?? null, [imageUrls, pageIndex]);

  return (
    <motion.div
      className="preview-panel"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <h2>Your notebook page</h2>
      <p className="muted">
        {isWriting
          ? "Watch your notes appear on the page…"
          : totalPages > 1
            ? `Page ${pageIndex + 1} of ${totalPages}`
            : "Ready to download."}
      </p>

      <div className="preview-frame">
        {isWriting ? (
          <AnimatedNotebookWriter text={text} style={style} onComplete={onWritingComplete} />
        ) : (
          <motion.img
            src={currentUrl ?? ""}
            alt="Handwritten notebook page"
            className="notebook-img"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </div>

      {!isWriting && totalPages > 1 && (
        <div className="pager">
          <button
            type="button"
            className="btn secondary"
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={pageIndex === 0}
          >
            Prev
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
            disabled={pageIndex === totalPages - 1}
          >
            Next
          </button>
        </div>
      )}

      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={onBack} disabled={isWriting}>
          Edit text
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => onDownloadCurrent(pageIndex)}
          disabled={isWriting || !currentUrl}
        >
          Download image
        </button>
      </div>

      {!isWriting && totalPages > 1 && (
        <button type="button" className="btn ghost" onClick={onDownloadAll}>
          Download all pages
        </button>
      )}

      <button type="button" className="btn ghost" onClick={onStartOver} disabled={isWriting}>
        Start over
      </button>
    </motion.div>
  );
}
