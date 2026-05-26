import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ImageCapture from "./components/ImageCapture";
import TextEditor from "./components/TextEditor";
import NotebookPreview from "./components/NotebookPreview";
import type { HandwritingStyle, Step } from "./types";
import { extractTextFromImage } from "./utils/ocr";
import { downloadDataUrl } from "./utils/notebookRenderer";
import GalaxyTitleCard from "./components/GalaxyTitleCard";
import StepPills from "./components/StepPills";
import "./App.css";

export default function App() {
  const [step, setStep] = useState<Step>("capture");
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [style, setStyle] = useState<HandwritingStyle>("ballpoint");
  const [notebookUrl, setNotebookUrl] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelected = useCallback(async (file: File) => {
    setError(null);
    setIsScanning(true);
    setScanProgress(0);

    const preview = URL.createObjectURL(file);
    setSourcePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });

    try {
      const extracted = await extractTextFromImage(file, setScanProgress);
      if (!extracted || !/[\p{L}\p{N}]/u.test(extracted)) {
        setError("Couldn't read text from this image. Try a sharper photo with the words in focus.");
        return;
      }
      setText(extracted);
      setStep("edit");
    } catch {
      setError("Could not read the image. Please try again.");
    } finally {
      setIsScanning(false);
    }
  }, []);

  const goToPreview = () => {
    setNotebookUrl(null);
    setStep("preview");
  };

  const startOver = () => {
    setStep("capture");
    setText("");
    setNotebookUrl(null);
    setError(null);
    if (sourcePreview) {
      URL.revokeObjectURL(sourcePreview);
      setSourcePreview(null);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-bg" aria-hidden="true" />
      <div className="app">
        <header className="header">
          <GalaxyTitleCard />
          <p className="tagline">Photo → Edit → Handwritten notes</p>
        </header>

        <StepPills current={step} />

        <main className="main">
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === "capture" && (
              <motion.div
                key="capture"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {isScanning && (
                  <div className="loading-overlay capture-loading">
                    <div className="spinner" />
                    <p>Reading text from image… {scanProgress}%</p>
                  </div>
                )}
                <ImageCapture onImageSelected={handleImageSelected} isProcessing={isScanning} />
              </motion.div>
            )}

            {step === "edit" && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <TextEditor
                  text={text}
                  onChange={setText}
                  style={style}
                  onStyleChange={setStyle}
                  onBack={startOver}
                  onNext={goToPreview}
                  previewUrl={sourcePreview ?? undefined}
                />
              </motion.div>
            )}

            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <NotebookPreview
                  text={text}
                  style={style}
                  imageUrl={notebookUrl}
                  onWritingComplete={setNotebookUrl}
                  onBack={() => {
                    setNotebookUrl(null);
                    setStep("edit");
                  }}
                  onDownload={() => notebookUrl && downloadDataUrl(notebookUrl)}
                  onStartOver={startOver}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
