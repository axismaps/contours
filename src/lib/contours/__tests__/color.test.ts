import { describe, expect, it } from "vitest";
import { hexWithAlpha, makeBathyScale, makeHypsoScale, normalizeHex } from "../color";

describe("normalizeHex", () => {
    it("expands short hex and lowercases", () => {
        expect(normalizeHex("#abc")).toBe("#aabbcc");
        expect(normalizeHex("ABC")).toBe("#aabbcc");
        expect(normalizeHex("#AABBCC")).toBe("#aabbcc");
        expect(normalizeHex("aabbcc")).toBe("#aabbcc");
    });

    it("tolerates surrounding whitespace", () => {
        expect(normalizeHex("  #8c7556 ")).toBe("#8c7556");
    });

    it("rejects anything that is not a 3 or 6 digit hex color", () => {
        for (const bad of ["", "#", "#ab", "#abcd", "#abcde", "#aabbccdd", "#ggg", "red", "rgb(1,2,3)", "# abc"]) {
            expect(normalizeHex(bad), bad).toBeNull();
        }
    });
});

describe("hexWithAlpha", () => {
    it("converts to rgba with the given alpha", () => {
        expect(hexWithAlpha("#ff8000", 0.5)).toBe("rgba(255,128,0,0.5)");
        expect(hexWithAlpha("#000000", 1)).toBe("rgba(0,0,0,1)");
    });

    it("accepts the same loose input as normalizeHex", () => {
        expect(hexWithAlpha("abc", 0.25)).toBe("rgba(170,187,204,0.25)");
    });

    it("falls back to black for invalid input", () => {
        expect(hexWithAlpha("nope", 0.3)).toBe("rgba(0,0,0,0.3)");
    });
});

describe("color scales", () => {
    it("hypso scale returns the end colors at the domain ends", () => {
        const scale = makeHypsoScale("#79a483", "#ffdecb", [0, 400]);
        expect(scale.domain()).toEqual([0, 400]);
        expect(scale(0)).toBe("rgb(121, 164, 131)");
        expect(scale(400)).toBe("rgb(255, 222, 203)");
    });

    it("bathy scale returns the end colors at the domain ends", () => {
        const scale = makeBathyScale("#315d9b", "#d5f2ff", [-200, -1]);
        expect(scale(-200)).toBe("rgb(49, 93, 155)");
        expect(scale(-1)).toBe("rgb(213, 242, 255)");
    });
});
