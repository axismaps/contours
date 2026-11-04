import { MIN_PIXELS_PER_BAND } from "./constants";

export interface ThresholdRange {
    min: number;
    max: number;
    thresholds: number[];
}

/**
 * Pick the contour thresholds for a grid of elevations: multiples of `interval`
 * from the lowest to the highest band that holds a meaningful number of pixels.
 * Bands with fewer than `minPixels` pixels at either end are treated as junk
 * (tile seams, no-data pixels) and dropped.
 */
export function computeThresholds(values: ArrayLike<number>, interval: number, minPixels = MIN_PIXELS_PER_BAND): ThresholdRange | null {
    if (!Number.isFinite(interval) || interval <= 0 || values.length === 0) return null;

    let rawMin = Infinity;
    let rawMax = -Infinity;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v < rawMin) rawMin = v;
        if (v > rawMax) rawMax = v;
    }

    const min = Math.floor(rawMin / interval) * interval;
    const max = Math.ceil(rawMax / interval) * interval;
    const bandCount = Math.round((max - min) / interval) + 1;
    if (!Number.isFinite(bandCount) || bandCount < 1) return null;

    const counts = new Uint32Array(bandCount);
    for (let i = 0; i < values.length; i++) {
        counts[Math.floor((values[i] - min) / interval)]++;
    }

    let first = -1;
    let last = -1;
    for (let b = 0; b < bandCount; b++) {
        if (counts[b] > minPixels) {
            if (first === -1) first = b;
            last = b;
        }
    }
    if (first === -1) return null;

    const thresholds: number[] = [];
    for (let b = first; b <= last; b++) thresholds.push(min + b * interval);

    return { min: thresholds[0], max: thresholds[thresholds.length - 1], thresholds };
}
