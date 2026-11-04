import { type ContourMultiPolygon, contours as d3Contours } from "d3-contour";
import { decodeElevationGrid } from "./elevation";
import { computeThresholds } from "./thresholds";
import type { ContourData, Unit } from "./types";

/**
 * Compute contour polygons for a viewport-sized grid of Terrarium pixels.
 * Returns null when no usable elevation data is present (for example before
 * any tile has loaded).
 */
export function computeContours(pixels: Uint8ClampedArray, width: number, height: number, interval: number, unit: Unit): ContourData | null {
    const values = decodeElevationGrid(pixels, width, height, unit);
    const range = computeThresholds(values, interval);
    if (!range) return null;

    // d3-contour's typings ask for number[], but it reads any array-like at runtime.
    const contours: ContourMultiPolygon[] = d3Contours().size([width, height]).thresholds(range.thresholds)(values as unknown as number[]);

    return { contours, min: range.min, max: range.max, interval, unit, width, height };
}
