// Body-part colours. Every body part has a single representative colour used
// across the app (chips, charts). Users may override any colour on the
// Exercises page; otherwise we fall back to a default palette of mid-vibrance,
// maximally-distinct hues. Colours are stored per user in
// `ExercisesDoc.bodyPartColors` (name -> hex).

// Twelve bright, vibrant colours (HSL ~90% sat, ~58% light) ordered so that
// consecutive body parts get maximally different hues.
export const BODY_PART_PALETTE: string[] = [
  "#f43434", // red
  "#34f4f4", // cyan
  "#f4f434", // yellow
  "#3454f4", // blue
  "#34f434", // green
  "#f434f4", // magenta
  "#f49434", // orange
  "#3494f4", // azure
  "#94f434", // lime
  "#9434f4", // purple
  "#34f494", // teal
  "#f43494", // pink
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Default colour for a body part. Uses the part's position in `order` so each
 * body part gets a distinct palette entry; falls back to a name hash for parts
 * not present in the ordering.
 */
export function defaultBodyPartColor(part: string, order: readonly string[] = []): string {
  const idx = order.indexOf(part);
  const i = idx >= 0 ? idx : hashString(part);
  return BODY_PART_PALETTE[i % BODY_PART_PALETTE.length];
}

/** Resolve a body part colour: user override first, then the default palette. */
export function resolveBodyPartColor(
  part: string,
  order: readonly string[] = [],
  overrides?: Record<string, string>
): string {
  return overrides?.[part] ?? defaultBodyPartColor(part, order);
}

/** Pick a readable text colour (black/white) for a given background hex. */
export function readableTextColor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#000";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  // Relative luminance (sRGB approximation).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000" : "#fff";
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => clampByte(x).toString(16).padStart(2, "0")).join("");
}

/** Blend a hex colour towards white by `amount` (0..1). */
export function lighten(hex: string, amount = 0.3): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

/** Blend a hex colour towards black by `amount` (0..1). */
export function darken(hex: string, amount = 0.3): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const k = 1 - amount;
  return toHex(r * k, g * k, b * k);
}

export type ColorMode = "light" | "dark";

/**
 * A vivid gradient for a body part, echoing the app's orange→yellow header
 * gradient. In dark mode the base colour fades towards black; in light mode it
 * fades towards white.
 */
export function bodyPartGradient(hex: string, mode: ColorMode = "dark"): string {
  const end = mode === "dark" ? darken(hex, 0.5) : lighten(hex, 0.45);
  return `linear-gradient(135deg, ${hex} 0%, ${end} 100%)`;
}

/** Readable text colour for a body-part gradient chip (judged at its midpoint). */
export function gradientTextColor(hex: string, mode: ColorMode = "dark"): string {
  const mid = mode === "dark" ? darken(hex, 0.25) : lighten(hex, 0.22);
  return readableTextColor(mid);
}
