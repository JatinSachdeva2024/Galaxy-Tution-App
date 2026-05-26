import type { HandwritingStyle, InkColor } from "../types";
import { HANDWRITING_STYLES, INK_COLORS } from "../types";

export const PAPER_WIDTH = 1200;
export const PAPER_HEIGHT = 1697;
const BINDING_WIDTH = 72;
export const MARGIN_LEFT = 118;
const MARGIN_RIGHT = 56;
const MARGIN_TOP = 88;
export const MARGIN_BOTTOM = 72;
export const LINE_SPACING = 46;
export const FIRST_LINE_Y = MARGIN_TOP + LINE_SPACING;

export const LINES_PER_PAGE =
  Math.floor((PAPER_HEIGHT - MARGIN_BOTTOM - FIRST_LINE_Y) / LINE_SPACING) + 1;

export interface ParsedLine {
  text: string;
  ink: InkColor;
  scale: number;
  isEmpty: boolean;
}

export function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function parseLines(raw: string): ParsedLine[] {
  return raw.split(/\n/).map((line) => {
    const trimmed = line.trimEnd();
    if (!trimmed) return { text: "", ink: "blue", scale: 1, isEmpty: true };

    if (/^#\s+/.test(trimmed)) {
      return {
        text: trimmed.replace(/^#\s+/, ""),
        ink: "blue",
        scale: 1.12,
        isEmpty: false,
      };
    }
    if (/^>\s+/.test(trimmed)) {
      return {
        text: trimmed.replace(/^>\s+/, ""),
        ink: "black",
        scale: 1,
        isEmpty: false,
      };
    }
    if (/^\*\s+/.test(trimmed)) {
      return {
        text: trimmed.replace(/^\*\s+/, ""),
        ink: "black",
        scale: 1.02,
        isEmpty: false,
      };
    }

    return { text: trimmed, ink: "blue", scale: 1, isEmpty: false };
  });
}

export function drawPaperTexture(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#fefefe";
  ctx.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT);

  const grad = ctx.createLinearGradient(0, 0, PAPER_WIDTH, 0);
  grad.addColorStop(0, "rgba(0,0,0,0.04)");
  grad.addColorStop(0.08, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.01)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT);

  ctx.globalAlpha = 0.022;
  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * PAPER_WIDTH;
    const y = Math.random() * PAPER_HEIGHT;
    ctx.fillStyle = Math.random() > 0.5 ? "#b8b8b8" : "#e0e0e0";
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

export function drawBindingAndRules(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ececec";
  ctx.fillRect(0, 0, BINDING_WIDTH, PAPER_HEIGHT);

  const shadow = ctx.createLinearGradient(BINDING_WIDTH, 0, BINDING_WIDTH + 40, 0);
  shadow.addColorStop(0, "rgba(0,0,0,0.12)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(BINDING_WIDTH, 0, 40, PAPER_HEIGHT);

  ctx.strokeStyle = "rgba(180,180,180,0.55)";
  ctx.lineWidth = 2.5;
  for (let y = 70; y < PAPER_HEIGHT - 50; y += 52) {
    ctx.beginPath();
    ctx.arc(BINDING_WIDTH + 6, y, 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "#e8b0b0";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(MARGIN_LEFT - 22, 0);
  ctx.lineTo(MARGIN_LEFT - 22, PAPER_HEIGHT);
  ctx.stroke();

  ctx.strokeStyle = "#8da3c4";
  ctx.lineWidth = 1.05;
  for (let y = FIRST_LINE_Y; y < PAPER_HEIGHT - MARGIN_BOTTOM; y += LINE_SPACING) {
    const wobble = Math.sin(y * 0.02) * 0.4;
    ctx.beginPath();
    ctx.moveTo(BINDING_WIDTH + 8, y + wobble);
    ctx.lineTo(PAPER_WIDTH - 12, y + wobble * 0.6);
    ctx.stroke();
  }
}

export function drawNotebookBackground(ctx: CanvasRenderingContext2D) {
  drawPaperTexture(ctx);
  drawBindingAndRules(ctx);
}

export function wrapLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  font: string
): string[] {
  ctx.font = `${fontSize}px ${font}`;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawBallpointChar(
  ctx: CanvasRenderingContext2D,
  ch: string,
  x: number,
  baselineY: number,
  fontSize: number,
  font: string,
  hex: string,
  rng: () => number
) {
  if (ch === " ") return;

  const jitterY = (rng() - 0.5) * 5;
  const jitterX = (rng() - 0.5) * 2.2;
  const rotation = (rng() - 0.5) * 0.07;
  const scale = 0.9 + rng() * 0.14;
  const opacity = 0.78 + rng() * 0.22;
  const pressure = 0.85 + rng() * 0.15;
  const size = fontSize * scale;

  ctx.save();
  ctx.translate(x + jitterX, baselineY + jitterY);
  ctx.rotate(rotation);
  ctx.font = `${size}px ${font}`;

  ctx.globalAlpha = opacity * 0.18;
  ctx.fillStyle = hex;
  ctx.fillText(ch, 0.6, 0.4);
  ctx.fillText(ch, -0.4, 0.2);

  ctx.globalAlpha = opacity * 0.55 * pressure;
  ctx.fillStyle = hex;
  ctx.fillText(ch, 0.15, 0.1);

  ctx.globalAlpha = opacity * pressure;
  ctx.fillStyle = hex;
  ctx.fillText(ch, 0, 0);

  if (rng() > 0.92) {
    ctx.globalAlpha = opacity * 0.35;
    ctx.beginPath();
    ctx.arc(0, size * 0.15, 0.8 + rng(), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function measureCharAdvance(
  ctx: CanvasRenderingContext2D,
  ch: string,
  fontSize: number,
  font: string,
  rng: () => number
): number {
  ctx.font = `${fontSize}px ${font}`;
  if (ch === " ") {
    return ctx.measureText(" ").width * (0.88 + rng() * 0.28);
  }
  return ctx.measureText(ch).width * (0.97 + rng() * 0.06);
}

export function drawHandwrittenLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  startX: number,
  baselineY: number,
  fontSize: number,
  font: string,
  ink: InkColor,
  lineSeed: number,
  lineTilt: number
) {
  if (!line) return;

  const hex = INK_COLORS[ink];
  const rng = mulberry32(lineSeed);
  let cursorX = startX;
  const chars = [...line];
  const tiltPerChar = lineTilt / Math.max(chars.length, 1);

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const y = baselineY + i * tiltPerChar + (rng() - 0.5) * 0.8;

    if (ch !== " ") {
      drawBallpointChar(ctx, ch, cursorX, y, fontSize, font, hex, rng);
    }

    cursorX += measureCharAdvance(ctx, ch, fontSize, font, rng);
  }
}

export function getRuleY(lineIndex: number) {
  return FIRST_LINE_Y + lineIndex * LINE_SPACING;
}

export function isPastPageBottom(lineIndex: number) {
  return getRuleY(lineIndex) > PAPER_HEIGHT - MARGIN_BOTTOM;
}

export interface LineDrawSpec {
  text: string;
  ink: InkColor;
  fontSize: number;
  font: string;
  baselineY: number;
  lineSeed: number;
  lineTilt: number;
  startX: number;
}

export function drawLineSpec(ctx: CanvasRenderingContext2D, spec: LineDrawSpec) {
  drawHandwrittenLine(
    ctx,
    spec.text,
    spec.startX,
    spec.baselineY,
    spec.fontSize,
    spec.font,
    spec.ink,
    spec.lineSeed,
    spec.lineTilt
  );
}

export function buildLineSpec(
  pl: ParsedLine,
  lineText: string,
  lineIndex: number,
  style: HandwritingStyle,
  /** Full line text for stable random seed while animating partial words */
  seedLineText?: string
): LineDrawSpec {
  const styleConfig = HANDWRITING_STYLES[style];
  const fontSize = styleConfig.size * pl.scale;
  const ruleY = getRuleY(lineIndex);
  const seedKey = seedLineText ?? lineText;
  const lineSeed = hashString(`${lineIndex}:${seedKey}:${pl.ink}`);

  return {
    text: lineText,
    ink: pl.ink,
    fontSize,
    font: styleConfig.font,
    baselineY: ruleY - 10 + (hashString(seedKey) % 5) - 2,
    lineSeed,
    lineTilt: (mulberry32(lineSeed)() - 0.5) * 3.5,
    startX: MARGIN_LEFT + (mulberry32(lineSeed + 1)() - 0.5) * 4,
  };
}

export function buildWrappedLines(text: string, style: HandwritingStyle) {
  const styleConfig = HANDWRITING_STYLES[style];
  const parsed = parseLines(text);
  const maxWidth = PAPER_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d")!;
  const wrapped: { line: ParsedLine; text: string }[] = [];

  for (const pl of parsed) {
    if (pl.isEmpty) {
      wrapped.push({ line: pl, text: "" });
      continue;
    }
    const size = styleConfig.size * pl.scale;
    measureCtx.font = `${size}px ${styleConfig.font}`;
    const parts = wrapLine(measureCtx, pl.text, maxWidth, size, styleConfig.font);
    for (const part of parts) {
      wrapped.push({ line: pl, text: part });
    }
  }

  return wrapped;
}
