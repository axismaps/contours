import { interpolateHclLong } from "d3-interpolate";
import { type ScaleLinear, scaleLinear } from "d3-scale";

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Accepts `#abc`, `abc`, `#aabbcc` or `aabbcc`; returns lowercase `#aabbcc`, or null if it isn't a hex color. */
export function normalizeHex(input: string): string | null {
    const match = HEX_RE.exec(input.trim());
    if (!match) return null;
    let hex = match[1].toLowerCase();
    if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
    return `#${hex}`;
}

/** `#rrggbb` → `rgba(r,g,b,alpha)`. */
export function hexWithAlpha(hex: string, alpha: number): string {
    const normalized = normalizeHex(hex) ?? "#000000";
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export type ColorScale = ScaleLinear<string, string>;

/** Hypsometric tints: low → high elevation, interpolated the long way round the HCL hue circle. */
export const makeHypsoScale = (low: string, high: string, domain: [number, number]): ColorScale =>
    scaleLinear<string, string>().domain(domain).range([low, high]).interpolate(interpolateHclLong);

/** Bathymetric tints: deep → shallow, plain RGB interpolation. */
export const makeBathyScale = (deep: string, shallow: string, domain: [number, number]): ColorScale =>
    scaleLinear<string, string>().domain(domain).range([deep, shallow]);
