import { describe, expect, it } from "vitest";
import { hexWithAlpha } from "../color";
import { contoursToSvg, fillFor, hasBathymetry, resolveStyle } from "../draw";
import { makeData, makeSettings } from "./fixtures";

const land = makeData([0, 100, 200, 300, 400]);
const coast = makeData([-200, -100, 0, 100, 200, 300, 400]);

describe("hasBathymetry", () => {
    it("is true only when the lowest contour is below sea level", () => {
        expect(hasBathymetry(land)).toBe(false);
        expect(hasBathymetry(coast)).toBe(true);
        expect(hasBathymetry(makeData([0, 100]))).toBe(false);
    });
});

describe("resolveStyle", () => {
    it("spans the whole elevation range with the hypsometric scale by default", () => {
        const style = resolveStyle(coast, makeSettings({ background: "hypso", bathymetry: "none" }));
        expect(style.bathymetry).toBe("none");
        expect(style.hypso.domain()).toEqual([-200, 400]);
    });

    it("starts the hypsometric scale at sea level when bathymetry is on and the view dips below it", () => {
        for (const bathymetry of ["solid", "bathy"] as const) {
            const style = resolveStyle(coast, makeSettings({ background: "hypso", bathymetry }));
            expect(style.bathymetry).toBe(bathymetry);
            expect(style.hypso.domain()).toEqual([0, 400]);
            expect(style.bathy.domain()).toEqual([-200, -1]);
        }
    });

    it("ignores the bathymetry setting when nothing is below sea level", () => {
        const style = resolveStyle(land, makeSettings({ background: "hypso", bathymetry: "bathy" }));
        expect(style.bathymetry).toBe("none");
        expect(style.hypso.domain()).toEqual([0, 400]);
    });

    it("derives the index interval from the settings in lines mode only", () => {
        expect(resolveStyle(land, makeSettings({ mapType: "lines", indexEvery: 5, interval: 100 })).indexInterval).toBe(500);
        expect(resolveStyle(land, makeSettings({ mapType: "lines", indexEvery: 0, interval: 100 })).indexInterval).toBe(0);
        expect(resolveStyle(land, makeSettings({ mapType: "illuminated", indexEvery: 5, interval: 100 })).indexInterval).toBe(0);
    });

    it("draws the illuminated highlight at half alpha", () => {
        const style = resolveStyle(land, makeSettings({ highlightColor: "#fffbec" }));
        expect(style.highlight).toBe(hexWithAlpha("#fffbec", 0.5));
        expect(style.highlight).toBe("rgba(255,251,236,0.5)");
    });
});

describe("fillFor", () => {
    it("returns no fill without a background", () => {
        const style = resolveStyle(land, makeSettings({ background: "none", bathymetry: "none" }));
        expect(fillFor(0, style)).toBeNull();
        expect(fillFor(400, style)).toBeNull();
    });

    it("uses the solid color for a solid background", () => {
        const style = resolveStyle(land, makeSettings({ background: "solid", solidColor: "#fffcfa" }));
        expect(fillFor(0, style)).toBe("#fffcfa");
        expect(fillFor(400, style)).toBe("#fffcfa");
    });

    it("uses the hypsometric scale for a hypso background", () => {
        const style = resolveStyle(land, makeSettings({ background: "hypso", hypsoLowColor: "#79a483", hypsoHighColor: "#ffdecb" }));
        expect(fillFor(0, style)).toBe("rgb(121, 164, 131)");
        expect(fillFor(400, style)).toBe("rgb(255, 222, 203)");
        expect(fillFor(200, style)).toBe(style.hypso(200));
    });

    it("fills below sea level with the ocean color or the bathymetric scale", () => {
        const solid = resolveStyle(coast, makeSettings({ background: "none", bathymetry: "solid", oceanColor: "#d5f2ff" }));
        expect(fillFor(-100, solid)).toBe("#d5f2ff");

        const bathy = resolveStyle(coast, makeSettings({ background: "none", bathymetry: "bathy", bathyDeepColor: "#315d9b", bathyShallowColor: "#d5f2ff" }));
        expect(fillFor(-200, bathy)).toBe("rgb(49, 93, 155)");
        expect(fillFor(-1, bathy)).toBe("rgb(213, 242, 255)");
        expect(fillFor(-100, bathy)).toBe(bathy.bathy(-100));
    });

    it("masks land with white when the sea floor is colored but the land is not", () => {
        const style = resolveStyle(coast, makeSettings({ background: "none", bathymetry: "solid" }));
        expect(fillFor(0, style)).toBe("#fff");
        expect(fillFor(300, style)).toBe("#fff");

        const withLand = resolveStyle(coast, makeSettings({ background: "solid", solidColor: "#eeeeee", bathymetry: "solid" }));
        expect(fillFor(0, withLand)).toBe("#eeeeee");
    });

    it("only applies underwater fills when the data has negative values", () => {
        const style = resolveStyle(land, makeSettings({ background: "none", bathymetry: "solid", oceanColor: "#d5f2ff" }));
        expect(fillFor(-50, style)).toBeNull();
        expect(fillFor(0, style)).toBeNull();

        const solidLand = resolveStyle(land, makeSettings({ background: "solid", solidColor: "#fffcfa", bathymetry: "bathy" }));
        expect(fillFor(-50, solidLand)).toBe("#fffcfa");
    });
});

describe("contoursToSvg", () => {
    const paths = (svg: string) => svg.match(/<path [^>]*\/>/g) ?? [];
    const attr = (path: string | undefined, name: string) => (path === undefined ? undefined : new RegExp(` ${name}="([^"]*)"`).exec(path)?.[1]);

    it("crops the viewport by the buffer and translates the paths back", () => {
        const svg = contoursToSvg(land, makeSettings(), 5);
        expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50">')).toBe(true);
        expect(svg).toContain('<g transform="translate(-5 -5)" stroke-linejoin="round">');
        expect(svg.trimEnd().endsWith("</g>\n</svg>")).toBe(true);
    });

    it("writes one path per contour with an elev-<value> id", () => {
        const svg = contoursToSvg(coast, makeSettings(), 5);
        const found = paths(svg);
        expect(found).toHaveLength(coast.contours.length);
        expect(found.map((p) => attr(p, "id"))).toEqual(["elev--200", "elev--100", "elev-0", "elev-100", "elev-200", "elev-300", "elev-400"]);
        expect(attr(found[0], "d")).toBe("M0,0L10,0L10,10L0,10Z");
    });

    it("uses the index line width on index contours in lines mode", () => {
        const svg = contoursToSvg(
            land,
            makeSettings({ mapType: "lines", background: "none", indexEvery: 2, interval: 100, lineWidth: 0.75, indexLineWidth: 1.5, lineColor: "#8c7556" }),
            5,
        );
        const widths = Object.fromEntries(paths(svg).map((p) => [attr(p, "id"), attr(p, "stroke-width")]));
        expect(widths).toEqual({ "elev-0": "1.5", "elev-100": "0.75", "elev-200": "1.5", "elev-300": "0.75", "elev-400": "1.5" });
        for (const p of paths(svg)) {
            expect(attr(p, "stroke")).toBe("#8c7556");
            expect(attr(p, "fill")).toBe("none");
        }
    });

    it("uses the shadow width and translucent highlight in illuminated mode", () => {
        const svg = contoursToSvg(land, makeSettings({ mapType: "illuminated", indexEvery: 2, shadowWidth: 3, highlightColor: "#fffbec" }), 5);
        for (const p of paths(svg)) {
            expect(attr(p, "stroke-width")).toBe("3");
            expect(attr(p, "stroke")).toBe("rgba(255,251,236,0.5)");
        }
    });

    it("writes the resolved fill and escapes attribute values", () => {
        const svg = contoursToSvg(
            coast,
            makeSettings({ background: "solid", solidColor: "#fffcfa", bathymetry: "solid", oceanColor: "#d5f2ff", lineColor: 'a"<b&c' }),
            5,
        );
        const fills = Object.fromEntries(paths(svg).map((p) => [attr(p, "id"), attr(p, "fill")]));
        expect(fills["elev--200"]).toBe("#d5f2ff");
        expect(fills["elev-0"]).toBe("#fffcfa");
        expect(attr(paths(svg)[0], "stroke")).toBe("a&quot;&lt;b&amp;c");
    });

    it("drops the buffer from the width and height", () => {
        const svg = contoursToSvg(makeData([100], { width: 20, height: 20 }), makeSettings(), 0);
        expect(svg).toContain('width="20" height="20" viewBox="0 0 20 20"');
        expect(svg).toContain("translate(0 0)");
    });
});
