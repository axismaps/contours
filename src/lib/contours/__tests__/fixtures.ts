import type { ContourMultiPolygon } from "d3-contour";
import { DEFAULT_SETTINGS } from "../constants";
import type { ContourData, ContourSettings } from "../types";

/** A square contour polygon at `value`, optionally with a square hole inside it. */
export const square = (value: number, size = 10, hole = false): ContourMultiPolygon => {
    const outer: [number, number][] = [
        [0, 0],
        [size, 0],
        [size, size],
        [0, size],
        [0, 0],
    ];
    const inner: [number, number][] = [
        [2, 2],
        [2, size - 2],
        [size - 2, size - 2],
        [size - 2, 2],
        [2, 2],
    ];
    return { type: "MultiPolygon", value, coordinates: [hole ? [outer, inner] : [outer]] };
};

/** Contour data for the given threshold values on a small synthetic grid. */
export const makeData = (values: number[], overrides: Partial<ContourData> = {}): ContourData => ({
    contours: values.map((v) => square(v)),
    min: Math.min(...values),
    max: Math.max(...values),
    interval: 100,
    unit: "m",
    width: 110,
    height: 60,
    ...overrides,
});

export const makeSettings = (overrides: Partial<ContourSettings> = {}): ContourSettings => ({ ...DEFAULT_SETTINGS, interval: 100, ...overrides });
