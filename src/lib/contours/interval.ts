import { METERS_TO_FEET } from "./constants";
import type { Unit } from "./types";

const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** Round to the nearest "nice" number: 1, 1.5, 2, 2.5, 3, 4, 5, 6 or 8 times a power of ten. */
export function roundToNice(value: number): number {
    if (!Number.isFinite(value) || value <= 0) return value;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const mantissa = value / magnitude;
    let best = NICE_STEPS[0];
    for (const step of NICE_STEPS) {
        if (Math.abs(step - mantissa) < Math.abs(best - mantissa)) best = step;
    }
    // Trim floating-point residue such as 1.5 * 0.1 = 0.15000000000000002.
    return Number((best * magnitude).toPrecision(12));
}

/**
 * Convert a contour interval between units, rounded to a nice number, so the
 * line density stays about the same instead of the number being kept as is
 * (500 ft → 150 m, not 500 m).
 */
export function convertInterval(interval: number, from: Unit, to: Unit): number {
    if (from === to) return interval;
    return roundToNice(to === "ft" ? interval * METERS_TO_FEET : interval / METERS_TO_FEET);
}
