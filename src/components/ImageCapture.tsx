import { useRef } from "react";

interface Props {
  onImageSelected: (file: File) => void;
  isProcessing: boolean;
}

export default function ImageCapture({ onImageSelected, isProcessing }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageSelected(file);
    e.target.value = "";
  };

  return (
    <div className="capture-panel">
      <div className="capture-icon" aria-hidden>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </div>

      <h2>Capture your text</h2>
      <p className="muted">
        Take a photo of notes, a book page, a whiteboard, or any text. We&apos;ll read it for you.
      </p>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFile}
        disabled={isProcessing}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
        disabled={isProcessing}
      />

      <div className="btn-row">
        <button
          type="button"
          className="btn primary"
          onClick={() => cameraRef.current?.click()}
          disabled={isProcessing}
        >
          Take photo
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={() => galleryRef.current?.click()}
          disabled={isProcessing}
        >
          Choose from gallery
        </button>
      </div>
    </div>
  );
}
