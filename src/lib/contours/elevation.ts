import { METERS_TO_FEET } from "./constants";
import type { Unit } from "./types";

/** Decode one Terrarium pixel (red, green, blue) to meters above sea level. */
export const terrariumToMeters = (r: number, g: number, b: number): number => r * 256 + g + b / 256 - 32768;

/**
 * No-data marker in a decoded grid. d3-contour treats NaN as missing (below
 * every threshold), so a hole in the data closes the surrounding contours
 * instead of pulling the elevation range down to -32768 m.
 */
export const NO_DATA = NaN;
export const isNoData = (value: number): boolean => Number.isNaN(value);

/**
 * Turn the RGBA pixels of a canvas that has Terrarium tiles drawn on it into a
 * row-major grid of rounded elevations in the requested unit, laid out the way
 * d3-contour expects (`x + y * width`). Fully transparent pixels, where no tile
 * was drawn (not loaded yet, failed, or outside the data), become `NO_DATA`.
 */
export function decodeElevationGrid(pixels: Uint8ClampedArray, width: number, height: number, unit: Unit): Float32Array {
    const factor = unit === "ft" ? METERS_TO_FEET : 1;
    const values = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const k = y * width + x;
            const i = k * 4;
            values[k] = pixels[i + 3] === 0 ? NO_DATA : Math.round(terrariumToMeters(pixels[i], pixels[i + 1], pixels[i + 2]) * factor);
        }
    }
    return values;
}
