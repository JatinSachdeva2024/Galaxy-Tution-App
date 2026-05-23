import { useCallback, useEffect, useState } from "react";
import ImageCapture from "./components/ImageCapture";
import TextEditor from "./components/TextEditor";
import NotebookPreview from "./components/NotebookPreview";
import type { HandwritingStyle, Step } from "./types";
import { extractTextFromImage } from "./utils/ocr";
import { downloadDataUrl, renderNotebookImage } from "./utils/notebookRenderer";
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
  const [isRendering, setIsRendering] = useState(false);
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
      if (!extracted) {
        setError(
          "No clear text found. Crop closer to the words, use good lighting, and avoid busy backgrounds."
        );
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

  const renderNotebook = useCallback(async () => {
    if (!text.trim()) return;
    setIsRendering(true);
    setError(null);
    try {
      const url = await renderNotebookImage({ text, style });
      setNotebookUrl(url);
    } catch {
      setError("Failed to render notebook. Please try again.");
    } finally {
      setIsRendering(false);
    }
  }, [text, style]);

  useEffect(() => {
    if (step === "preview") {
      renderNotebook();
    }
  }, [step, renderNotebook]);

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

        {isScanning && (
          <div className="loading-overlay">
            <div className="spinner" />
            <p>Reading text from image… {scanProgress}%</p>
          </div>
        )}

        {step === "capture" && (
          <ImageCapture onImageSelected={handleImageSelected} isProcessing={isScanning} />
        )}

        {step === "edit" && (
          <TextEditor
            text={text}
            onChange={setText}
            style={style}
            onStyleChange={setStyle}
            onBack={startOver}
            onNext={() => setStep("preview")}
            previewUrl={sourcePreview ?? undefined}
          />
        )}

        {step === "preview" && (
          <NotebookPreview
            imageUrl={notebookUrl}
            isRendering={isRendering}
            onBack={() => setStep("edit")}
            onDownload={() => notebookUrl && downloadDataUrl(notebookUrl)}
            onStartOver={startOver}
          />
        )}
      </main>
      </div>
    </div>
  );
}
