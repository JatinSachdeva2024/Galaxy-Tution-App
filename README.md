# Galaxy

Turn any photo of text into a downloadable image of **handwritten notes on lined notebook paper**.

## How it works

1. **Photo** — Take a picture or pick one from your gallery (notes, books, whiteboards, etc.).
2. **Edit** — OCR extracts the text; you fix mistakes and pick a handwriting style.
3. **Notebook** — Text is rendered on lined paper with a natural handwritten look. Download as PNG.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`). On a phone, use your computer’s LAN IP so the camera works over the same Wi‑Fi.

## Build for production

```bash
npm run build
npm run preview
```

## Tech

- **React + Vite** — UI
- **Tesseract.js** — On-device OCR (no API key; runs in the browser)
- **Canvas** — Lined notebook background + handwriting fonts with subtle jitter

## Colored pen lines (optional)

Like real student notes, you can color lines in the editor:

| Prefix | Color |
|--------|-------|
| `# Heading` | Red (title) |
| `> note` | Green |
| `* highlight` | Orange |
| (no prefix) | Ballpoint blue |

Default style **Ballpoint** uses blue ink on white ruled paper with spiral binding.

## Tips for best OCR results

- Good lighting, minimal glare
- Text in focus and filling most of the frame
- Straight-on angle (not too skewed)
