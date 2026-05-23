import type { HandwritingStyle } from "../types";
import { HANDWRITING_STYLES } from "../types";

interface Props {
  text: string;
  onChange: (text: string) => void;
  style: HandwritingStyle;
  onStyleChange: (style: HandwritingStyle) => void;
  onBack: () => void;
  onNext: () => void;
  previewUrl?: string;
}

export default function TextEditor({
  text,
  onChange,
  style,
  onStyleChange,
  onBack,
  onNext,
  previewUrl,
}: Props) {
  return (
    <div className="editor-panel">
      {previewUrl && (
        <div className="thumb-row">
          <img src={previewUrl} alt="Source" className="source-thumb" />
          <span className="muted small">Source image</span>
        </div>
      )}

      <label className="field-label" htmlFor="extracted-text">
        Edit extracted text
      </label>
      <textarea
        id="extracted-text"
        className="text-area"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your text will appear here after scanning..."
        rows={12}
      />

      <p className="format-hint muted small">
        Tip: start a line with <code># </code> for red headings, <code>&gt; </code> for green,{" "}
        <code>* </code> for orange — like colored pens in real notes.
      </p>

      <label className="field-label" htmlFor="handwriting-style">
        Handwriting style
      </label>
      <select
        id="handwriting-style"
        className="select"
        value={style}
        onChange={(e) => onStyleChange(e.target.value as HandwritingStyle)}
      >
        {(Object.keys(HANDWRITING_STYLES) as HandwritingStyle[]).map((key) => (
          <option key={key} value={key}>
            {HANDWRITING_STYLES[key].label}
          </option>
        ))}
      </select>

      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={onBack}>
          Retake photo
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={onNext}
          disabled={!text.trim()}
        >
          Create notebook
        </button>
      </div>
    </div>
  );
}
