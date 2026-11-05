import { describe, expect, it } from "vitest";
import { formatHash, parseHash } from "../hash";

describe("parseHash", () => {
    it("parses #zoom/lat/lng", () => {
        expect(parseHash("#13/35.3577/138.7331")).toEqual({ zoom: 13, lat: 35.3577, lng: 138.7331 });
    });

    it("accepts a hash without the leading #", () => {
        expect(parseHash("9/19.6801/-155.5132")).toEqual({ zoom: 9, lat: 19.6801, lng: -155.5132 });
    });

    it("reads the zoom as an integer", () => {
        expect(parseHash("#12.7/0/0")?.zoom).toBe(12);
    });

    it("rejects the wrong number of parts", () => {
        expect(parseHash("")).toBeNull();
        expect(parseHash("#")).toBeNull();
        expect(parseHash("#13")).toBeNull();
        expect(parseHash("#13/35.3")).toBeNull();
        expect(parseHash("#13/35.3/138.7/1")).toBeNull();
    });

    it("rejects non-numeric parts", () => {
        expect(parseHash("#zoom/lat/lng")).toBeNull();
        expect(parseHash("#/35.3/138.7")).toBeNull();
        expect(parseHash("#13//138.7")).toBeNull();
        expect(parseHash("#13/35.3/Infinity")).toBeNull();
    });

    it("rejects latitudes outside ±90", () => {
        expect(parseHash("#13/90.5/0")).toBeNull();
        expect(parseHash("#13/-91/0")).toBeNull();
        expect(parseHash("#13/90/0")).toEqual({ zoom: 13, lat: 90, lng: 0 });
    });
});

describe("formatHash", () => {
    it("uses more decimal places at higher zooms", () => {
        const position = { lat: 35.35774321, lng: 138.73312345 };
        expect(formatHash({ ...position, zoom: 1 })).toBe("#1/35/139");
        expect(formatHash({ ...position, zoom: 8 })).toBe("#8/35.358/138.733");
        expect(formatHash({ ...position, zoom: 13 })).toBe("#13/35.3577/138.7331");
        expect(formatHash({ ...position, zoom: 16 })).toBe("#16/35.3577/138.7331");
    });

    it("drops floating point noise from the zoom", () => {
        expect(formatHash({ zoom: 13.000001, lat: 0, lng: 0 })).toBe("#13/0.0000/0.0000");
        expect(formatHash({ zoom: 12.5, lat: 0, lng: 0 })).toBe("#12.5/0.0000/0.0000");
    });

    it("round-trips through parseHash", () => {
        const hash = "#13/35.3577/138.7331";
        expect(formatHash(parseHash(hash)!)).toBe(hash);

        const position = { zoom: 11, lat: 46.8358, lng: -121.7663 };
        expect(parseHash(formatHash(position))).toEqual(position);
    });
});
