function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  const toHex = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function mix(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  const k = clamp(t, 0, 1);
  return {
    r: a.r + (b.r - a.r) * k,
    g: a.g + (b.g - a.g) * k,
    b: a.b + (b.b - a.b) * k,
  };
}

function rgba(rgb: { r: number; g: number; b: number }, alpha: number) {
  const a = clamp(alpha, 0, 1);
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${a})`;
}

const darkPalette = {
  base: "#0a0a0b",
  base50: "#0d0d0e",
  base100: "#111113",
  base200: "#161618",
  base300: "#1c1c1f",
  base400: "#242428",
  surface: "#141416",
  surfaceElevated: "#1a1a1d",
  surfaceHover: "#1f1f23",
  border: "#2a2a2f",
  borderSubtle: "#1f1f24",
  textPrimary: "#e8e6e3",
  textSecondary: "#a8a5a0",
  textMuted: "#6b6863",
};

const lightPalette = {
  base: "#f6f6f8",
  base50: "#ffffff",
  base100: "#f2f2f6",
  base200: "#ededf2",
  base300: "#e7e7ee",
  base400: "#e1e1ea",
  surface: "#ffffff",
  surfaceElevated: "#f7f7fb",
  surfaceHover: "#f1f1f6",
  border: "#d8d8e2",
  borderSubtle: "#ececf2",
  textPrimary: "#15151a",
  textSecondary: "#3c3c45",
  textMuted: "#6b6b76",
};

function applyBasePalette(mode: "dark" | "light") {
  const p = mode === "light" ? lightPalette : darkPalette;
  const root = document.documentElement;
  root.style.setProperty("--color-base", p.base);
  root.style.setProperty("--color-base-50", p.base50);
  root.style.setProperty("--color-base-100", p.base100);
  root.style.setProperty("--color-base-200", p.base200);
  root.style.setProperty("--color-base-300", p.base300);
  root.style.setProperty("--color-base-400", p.base400);
  root.style.setProperty("--color-surface", p.surface);
  root.style.setProperty("--color-surface-elevated", p.surfaceElevated);
  root.style.setProperty("--color-surface-hover", p.surfaceHover);
  root.style.setProperty("--color-border", p.border);
  root.style.setProperty("--color-border-subtle", p.borderSubtle);
  root.style.setProperty("--color-text-primary", p.textPrimary);
  root.style.setProperty("--color-text-secondary", p.textSecondary);
  root.style.setProperty("--color-text-muted", p.textMuted);
}

export function applyTheme(opts: {
  mode?: "dark" | "light";
  primaryHex?: string;
  accentHex?: string;
}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const mode = opts.mode === "light" ? "light" : "dark";
  root.setAttribute("data-theme", mode);
  applyBasePalette(mode);

  const primary = opts.primaryHex ? hexToRgb(opts.primaryHex) : null;
  const accent = opts.accentHex ? hexToRgb(opts.accentHex) : null;

  // Primary -> maps to existing Accent tokens (used widely for buttons/links).
  if (primary) {
    const hover = rgbToHex(mix(primary, { r: 255, g: 255, b: 255 }, 0.12));
    root.style.setProperty("--color-accent", rgbToHex(primary));
    root.style.setProperty("--color-accent-hover", hover);
    root.style.setProperty("--color-accent-muted", rgba(primary, 0.15));
    root.style.setProperty("--color-accent-glow", rgba(primary, 0.35));
  }

  // Secondary (accent) -> maps to Success tokens (used for completions).
  if (accent) {
    root.style.setProperty("--color-success", rgbToHex(accent));
    root.style.setProperty("--color-success-muted", rgba(accent, 0.15));
    root.style.setProperty("--color-success-glow", rgba(accent, 0.35));
  }
}

