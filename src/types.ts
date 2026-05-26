export type Step = "capture" | "edit" | "preview";

export type HandwritingStyle =
  | "ballpoint"
  | "neat"
  | "casual"
  | "loose"
  | "quick"
  | "script"
  | "study";

export type InkColor = "blue" | "black";

/** Ballpoint pen inks */
export const INK_COLORS: Record<InkColor, string> = {
  blue: "#1a4fad",
  black: "#141820",
};

export const HANDWRITING_STYLES: Record<
  HandwritingStyle,
  { label: string; font: string; size: number }
> = {
  ballpoint: { label: "Ballpoint", font: "'Patrick Hand', cursive", size: 30 },
  neat: { label: "Neat cursive", font: "'Caveat', cursive", size: 34 },
  casual: { label: "Casual", font: "'Kalam', cursive", size: 28 },
  loose: { label: "Loose & flowing", font: "'Reenie Beanie', cursive", size: 36 },
  quick: { label: "Quick notes", font: "'Indie Flower', cursive", size: 30 },
  script: { label: "Soft script", font: "'Gloria Hallelujah', cursive", size: 26 },
  study: { label: "Study hand", font: "'Cedarville Cursive', cursive", size: 32 },
};
