import { describe, expect, it } from "vitest";
import { convertInterval, roundToNice } from "../interval";

describe("roundToNice", () => {
    it("snaps to 1, 1.5, 2, 2.5, 3, 4, 5, 6 or 8 times a power of ten", () => {
        expect(roundToNice(152.4)).toBe(150);
        expect(roundToNice(328.084)).toBe(300);
        expect(roundToNice(1640.42)).toBe(1500);
        expect(roundToNice(6.096)).toBe(6);
        expect(roundToNice(0.3048)).toBe(0.3);
        expect(roundToNice(97)).toBe(100);
        expect(roundToNice(0.15000000000000002)).toBe(0.15);
    });

    it("leaves non-positive and non-finite values alone", () => {
        expect(roundToNice(0)).toBe(0);
        expect(roundToNice(-5)).toBe(-5);
        expect(roundToNice(NaN)).toBeNaN();
    });
});

describe("convertInterval", () => {
    it("keeps the density about the same when switching units", () => {
        expect(convertInterval(500, "ft", "m")).toBe(150);
        expect(convertInterval(100, "m", "ft")).toBe(300);
        expect(convertInterval(20, "ft", "m")).toBe(6);
        expect(convertInterval(10, "m", "ft")).toBe(30);
        expect(convertInterval(1000, "ft", "m")).toBe(300);
        expect(convertInterval(1, "ft", "m")).toBe(0.3);
    });

    it("is the identity for the same unit", () => {
        expect(convertInterval(123, "ft", "ft")).toBe(123);
        expect(convertInterval(7.5, "m", "m")).toBe(7.5);
    });
});
