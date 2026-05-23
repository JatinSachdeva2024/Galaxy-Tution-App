interface Props {
  imageUrl: string | null;
  isRendering: boolean;
  onBack: () => void;
  onDownload: () => void;
  onStartOver: () => void;
}

export default function NotebookPreview({
  imageUrl,
  isRendering,
  onBack,
  onDownload,
  onStartOver,
}: Props) {
  return (
    <div className="preview-panel">
      <h2>Your notebook page</h2>
      <p className="muted">Text rendered as handwriting on lined paper.</p>

      <div className="preview-frame">
        {isRendering && (
          <div className="preview-loading">
            <div className="spinner" />
            <span>Rendering handwriting...</span>
          </div>
        )}
        {imageUrl && !isRendering && (
          <img src={imageUrl} alt="Handwritten notebook page" className="notebook-img" />
        )}
      </div>

      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={onBack} disabled={isRendering}>
          Edit text
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={onDownload}
          disabled={!imageUrl || isRendering}
        >
          Download image
        </button>
      </div>

      <button type="button" className="btn ghost" onClick={onStartOver} disabled={isRendering}>
        Start over
      </button>
    </div>
  );
}
