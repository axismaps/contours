import { describe, expect, it } from "vitest";
import { MIN_PIXELS_PER_BAND } from "../constants";
import { computeThresholds } from "../thresholds";

/** Repeat each value `count` times, so a "band" can be given an exact pixel count. */
const fill = (...bands: Array<[value: number, count: number]>): number[] => bands.flatMap(([value, count]) => Array<number>(count).fill(value));

describe("computeThresholds", () => {
    it("returns null for empty input", () => {
        expect(computeThresholds([], 100)).toBeNull();
        expect(computeThresholds(new Int32Array(0), 100)).toBeNull();
    });

    it("returns null for an invalid interval", () => {
        const values = fill([100, 60]);
        expect(computeThresholds(values, 0)).toBeNull();
        expect(computeThresholds(values, -50)).toBeNull();
        expect(computeThresholds(values, Number.NaN)).toBeNull();
        expect(computeThresholds(values, Number.POSITIVE_INFINITY)).toBeNull();
    });

    it("rounds the range outwards to multiples of the interval", () => {
        const result = computeThresholds([-150, 120, 480], 100, 0);
        expect(result).toEqual({ min: -200, max: 400, thresholds: [-200, -100, 0, 100, 200, 300, 400] });
    });

    it("keeps empty bands in the middle of the range", () => {
        const result = computeThresholds([0, 1000], 250, 0);
        expect(result?.thresholds).toEqual([0, 250, 500, 750, 1000]);
    });

    it("drops junk bands at both ends by default", () => {
        const values = fill([5, 4], [120, 60], [220, 60], [320, 60], [950, 3]);
        expect(computeThresholds(values, 100)).toEqual({ min: 100, max: 300, thresholds: [100, 200, 300] });
    });

    it("needs strictly more than the minimum pixel count to keep a band", () => {
        const body: Array<[number, number]> = [[500, 200]];
        expect(computeThresholds(fill([0, MIN_PIXELS_PER_BAND], ...body), 100)?.thresholds).toEqual([500]);
        expect(computeThresholds(fill([0, MIN_PIXELS_PER_BAND + 1], ...body), 100)?.thresholds).toEqual([0, 100, 200, 300, 400, 500]);
    });

    it("honours a custom pixel minimum", () => {
        const values = fill([0, 2], [100, 3], [200, 10]);
        expect(computeThresholds(values, 100, 2)?.thresholds).toEqual([100, 200]);
        expect(computeThresholds(values, 100, 1)?.thresholds).toEqual([0, 100, 200]);
    });

    it("returns null when every band is junk", () => {
        expect(computeThresholds(fill([100, 10]), 100)).toBeNull();
    });

    it("accepts typed arrays", () => {
        const values = Int32Array.from(fill([10, 60], [90, 60]));
        expect(computeThresholds(values, 50)).toEqual({ min: 0, max: 50, thresholds: [0, 50] });
    });
});
