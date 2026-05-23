export type Step = "capture" | "edit" | "preview";

export type HandwritingStyle = "ballpoint" | "neat" | "casual";

export type InkColor = "blue" | "red" | "green" | "orange";

/** Ballpoint / gel pen colors matched to real student notebooks */
export const INK_COLORS: Record<InkColor, string> = {
  blue: "#1a4fad",
  red: "#c62828",
  green: "#2e7d32",
  orange: "#e65100",
};

export const HANDWRITING_STYLES: Record<
  HandwritingStyle,
  { label: string; font: string; size: number }
> = {
  ballpoint: { label: "Ballpoint (like notes)", font: "'Patrick Hand', cursive", size: 30 },
  neat: { label: "Neat cursive", font: "'Caveat', cursive", size: 34 },
  casual: { label: "Loose handwriting", font: "'Kalam', cursive", size: 28 },
};
