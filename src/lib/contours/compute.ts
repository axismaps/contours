import { type ContourMultiPolygon, contours as d3Contours } from "d3-contour";
import { decodeElevationGrid } from "./elevation";
import { computeThresholds } from "./thresholds";
import type { ContourResult, Unit } from "./types";

/**
 * Compute contour polygons for a viewport-sized grid of Terrarium pixels.
 * Pure and synchronous; the app runs it inside `contour.worker.ts` so the
 * main thread stays responsive. Returns `empty` when no usable elevation data
 * is present (for example before any tile has loaded) and `failed` when the
 * view would need an unreasonable number of contour lines.
 */
export function computeContours(pixels: Uint8ClampedArray, width: number, height: number, interval: number, unit: Unit): ContourResult {
    const values = decodeElevationGrid(pixels, width, height, unit);
    const range = computeThresholds(values, interval);
    if (range.status !== "ok") return range;

    // d3-contour's typings ask for number[], but it reads any array-like at runtime.
    const contours: ContourMultiPolygon[] = d3Contours().size([width, height]).thresholds(range.thresholds)(values as unknown as number[]);

    return { status: "ok", data: { contours, min: range.min, max: range.max, interval, unit, width, height } };
}
