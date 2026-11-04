import { METERS_TO_FEET } from "./constants";
import type { Unit } from "./types";

/** Decode one Terrarium pixel (red, green, blue) to meters above sea level. */
export const terrariumToMeters = (r: number, g: number, b: number): number => r * 256 + g + b / 256 - 32768;

/**
 * Turn the RGBA pixels of a canvas that has Terrarium tiles drawn on it into a
 * row-major grid of rounded elevations in the requested unit, laid out the way
 * d3-contour expects (`x + y * width`).
 */
export function decodeElevationGrid(pixels: Uint8ClampedArray, width: number, height: number, unit: Unit): Int32Array {
    const factor = unit === "ft" ? METERS_TO_FEET : 1;
    const values = new Int32Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            values[y * width + x] = Math.round(terrariumToMeters(pixels[i], pixels[i + 1], pixels[i + 2]) * factor);
        }
    }
    return values;
}
