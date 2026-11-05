import { describe, expect, it } from "vitest";
import { MAX_THRESHOLDS, MIN_PIXELS_PER_BAND } from "../constants";
import { NO_DATA } from "../elevation";
import { computeThresholds } from "../thresholds";

/** Repeat each value `count` times, so a "band" can be given an exact pixel count. */
const fill = (...bands: Array<[value: number, count: number]>): number[] => bands.flatMap(([value, count]) => Array<number>(count).fill(value));

/** Unwrap an "ok" result, failing the test otherwise. */
const ok = (result: ReturnType<typeof computeThresholds>) => {
    if (result.status !== "ok") throw new Error(`expected an ok result, got ${result.status}`);
    return result;
};

describe("computeThresholds", () => {
    it("is empty for empty input", () => {
        expect(computeThresholds([], 100)).toEqual({ status: "empty" });
        expect(computeThresholds(new Float32Array(0), 100)).toEqual({ status: "empty" });
    });

    it("is empty for an invalid interval", () => {
        const values = fill([100, 60]);
        expect(computeThresholds(values, 0)).toEqual({ status: "empty" });
        expect(computeThresholds(values, -50)).toEqual({ status: "empty" });
        expect(computeThresholds(values, Number.NaN)).toEqual({ status: "empty" });
        expect(computeThresholds(values, Number.POSITIVE_INFINITY)).toEqual({ status: "empty" });
    });

    it("rounds the range outwards to multiples of the interval", () => {
        const result = computeThresholds([-150, 120, 480], 100, 0);
        expect(result).toEqual({ status: "ok", min: -200, max: 400, thresholds: [-200, -100, 0, 100, 200, 300, 400] });
    });

    it("keeps empty bands in the middle of the range", () => {
        const result = computeThresholds([0, 1000], 250, 0);
        expect(ok(result).thresholds).toEqual([0, 250, 500, 750, 1000]);
    });

    it("drops junk bands at both ends by default", () => {
        const values = fill([5, 4], [120, 60], [220, 60], [320, 60], [950, 3]);
        expect(computeThresholds(values, 100)).toEqual({ status: "ok", min: 100, max: 300, thresholds: [100, 200, 300] });
    });

    it("needs strictly more than the minimum pixel count to keep a band", () => {
        const body: Array<[number, number]> = [[500, 200]];
        expect(ok(computeThresholds(fill([0, MIN_PIXELS_PER_BAND], ...body), 100)).thresholds).toEqual([500]);
        expect(ok(computeThresholds(fill([0, MIN_PIXELS_PER_BAND + 1], ...body), 100)).thresholds).toEqual([0, 100, 200, 300, 400, 500]);
    });

    it("honours a custom pixel minimum", () => {
        const values = fill([0, 2], [100, 3], [200, 10]);
        expect(ok(computeThresholds(values, 100, 2)).thresholds).toEqual([100, 200]);
        expect(ok(computeThresholds(values, 100, 1)).thresholds).toEqual([0, 100, 200]);
    });

    it("is empty when every band is junk", () => {
        expect(computeThresholds(fill([100, 10]), 100)).toEqual({ status: "empty" });
    });

    it("accepts typed arrays", () => {
        const values = Float32Array.from(fill([10, 60], [90, 60]));
        expect(computeThresholds(values, 50)).toEqual({ status: "ok", min: 0, max: 50, thresholds: [0, 50] });
    });

    it("ignores no-data values", () => {
        const values = fill([NO_DATA, 500], [120, 60], [220, 60]);
        expect(computeThresholds(values, 100)).toEqual({ status: "ok", min: 100, max: 200, thresholds: [100, 200] });
        expect(computeThresholds(fill([NO_DATA, 500]), 100)).toEqual({ status: "empty" });
    });

    it("refuses a range that needs more than the maximum number of thresholds", () => {
        // 0 .. 3000 at 1 unit: 3001 bands, each well above the pixel minimum.
        const values = fill(...Array.from({ length: 3001 }, (_, i): [number, number] => [i, 2]));
        expect(computeThresholds(values, 1, 1)).toEqual({ status: "failed", problem: { kind: "too-many-thresholds", count: 3001, limit: MAX_THRESHOLDS } });
        expect(computeThresholds(values, 1, 1, 5000).status).toBe("ok");
    });

    it("refuses an absurd range before counting bands", () => {
        const result = computeThresholds([0, 1_000_000], 1, 0, 10);
        expect(result.status).toBe("failed");
        if (result.status === "failed") expect(result.problem).toEqual({ kind: "too-many-thresholds", count: 1_000_001, limit: 10 });
    });
});
