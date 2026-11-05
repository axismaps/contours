import { describe, expect, it } from "vitest";
import { NO_DATA, decodeElevationGrid, isNoData, terrariumToMeters } from "../elevation";

describe("terrariumToMeters", () => {
    it("decodes sea level and the extremes of the encoding", () => {
        expect(terrariumToMeters(128, 0, 0)).toBe(0);
        expect(terrariumToMeters(0, 0, 0)).toBe(-32768);
        expect(terrariumToMeters(255, 255, 255)).toBeCloseTo(32767.996, 3);
    });

    it("weights the channels as red * 256 + green + blue / 256", () => {
        expect(terrariumToMeters(128, 1, 0)).toBe(1);
        expect(terrariumToMeters(128, 0, 128)).toBe(0.5);
        expect(terrariumToMeters(129, 0, 0)).toBe(256);
        // Everest: 8848 m = 41616 above the -32768 offset = 162 * 256 + 144.
        expect(terrariumToMeters(162, 144, 0)).toBe(8848);
    });
});

/** Build RGBA pixel data for a row-major list of (r, g, b) triples. */
const rgba = (triples: Array<[number, number, number]>): Uint8ClampedArray => {
    const pixels = new Uint8ClampedArray(triples.length * 4);
    triples.forEach(([r, g, b], i) => {
        pixels.set([r, g, b, 255 - i], i * 4);
    });
    return pixels;
};

describe("decodeElevationGrid", () => {
    // A 2 × 2 grid: 0.5 m, 10 m on the first row, -10 m and 8848 m on the second.
    const pixels = rgba([
        [128, 0, 128],
        [128, 10, 0],
        [127, 246, 0],
        [162, 144, 0],
    ]);

    it("returns a row-major Float32Array of rounded metres", () => {
        const grid = decodeElevationGrid(pixels, 2, 2, "m");
        expect(grid).toBeInstanceOf(Float32Array);
        expect(grid).toHaveLength(4);
        expect(Array.from(grid)).toEqual([1, 10, -10, 8848]);
    });

    it("converts to feet before rounding", () => {
        const grid = decodeElevationGrid(pixels, 2, 2, "ft");
        expect(Array.from(grid)).toEqual([2, 33, -33, 29029]);
    });

    it("treats fully transparent pixels as no-data", () => {
        const withHole = new Uint8ClampedArray(pixels);
        withHole[1 * 4 + 3] = 0;
        const grid = decodeElevationGrid(withHole, 2, 2, "m");
        expect(isNoData(grid[1])).toBe(true);
        expect(Number.isNaN(NO_DATA)).toBe(true);
        expect(Array.from(grid).filter((v) => !isNoData(v))).toEqual([1, -10, 8848]);
    });

    it("ignores partial alpha and lays rows out as x + y * width", () => {
        const wide = rgba([
            [128, 1, 0],
            [128, 2, 0],
            [128, 3, 0],
            [128, 4, 0],
            [128, 5, 0],
            [128, 6, 0],
        ]);
        const grid = decodeElevationGrid(wide, 3, 2, "m");
        expect(grid[0 + 1 * 3]).toBe(4);
        expect(grid[2 + 1 * 3]).toBe(6);
        expect(Array.from(grid)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("returns an empty grid for an empty canvas", () => {
        expect(decodeElevationGrid(new Uint8ClampedArray(0), 0, 0, "m")).toHaveLength(0);
    });
});
