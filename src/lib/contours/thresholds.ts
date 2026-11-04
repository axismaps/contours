import { MAX_THRESHOLDS, MIN_PIXELS_PER_BAND } from "./constants";
import { isNoData } from "./elevation";
import type { ContourProblem } from "./types";

export interface ThresholdRange {
    min: number;
    max: number;
    thresholds: number[];
}

export type ThresholdResult = ({ status: "ok" } & ThresholdRange) | { status: "empty" } | { status: "failed"; problem: ContourProblem };

/**
 * Pick the contour thresholds for a grid of elevations: multiples of `interval`
 * from the lowest to the highest band that holds a meaningful number of pixels.
 * No-data values are ignored. Bands with fewer than `minPixels` pixels at
 * either end are treated as junk (tile seams, stray pixels) and dropped.
 * A range that would need more than `maxThresholds` lines is refused rather
 * than computed, since contouring it would freeze the page.
 */
export function computeThresholds(
    values: ArrayLike<number>,
    interval: number,
    minPixels = MIN_PIXELS_PER_BAND,
    maxThresholds = MAX_THRESHOLDS,
): ThresholdResult {
    if (!Number.isFinite(interval) || interval <= 0) return { status: "empty" };

    let rawMin = Infinity;
    let rawMax = -Infinity;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (isNoData(v)) continue;
        if (v < rawMin) rawMin = v;
        if (v > rawMax) rawMax = v;
    }
    if (rawMin === Infinity) return { status: "empty" };

    const min = Math.floor(rawMin / interval) * interval;
    const max = Math.ceil(rawMax / interval) * interval;
    const bandCount = Math.round((max - min) / interval) + 1;
    if (!Number.isFinite(bandCount) || bandCount < 1) return { status: "empty" };
    // Far beyond the cap even before junk bands are trimmed: don't bother counting.
    if (bandCount > maxThresholds * 100) return { status: "failed", problem: { kind: "too-many-thresholds", count: bandCount, limit: maxThresholds } };

    const counts = new Uint32Array(bandCount);
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (isNoData(v)) continue;
        counts[Math.floor((v - min) / interval)]++;
    }

    let first = -1;
    let last = -1;
    for (let b = 0; b < bandCount; b++) {
        if (counts[b] > minPixels) {
            if (first === -1) first = b;
            last = b;
        }
    }
    if (first === -1) return { status: "empty" };

    const count = last - first + 1;
    if (count > maxThresholds) return { status: "failed", problem: { kind: "too-many-thresholds", count, limit: maxThresholds } };

    const thresholds: number[] = [];
    for (let b = first; b <= last; b++) thresholds.push(min + b * interval);

    return { status: "ok", min: thresholds[0], max: thresholds[thresholds.length - 1], thresholds };
}
