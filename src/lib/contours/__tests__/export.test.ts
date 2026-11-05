import { describe, expect, it, vi } from "vitest";
import { contoursToGeoJson } from "../export";
import { makeData, square } from "./fixtures";

describe("contoursToGeoJson", () => {
    const toLngLat = (x: number, y: number): [number, number] => [x / 10, 5 - y / 10];

    it("builds a FeatureCollection with one MultiPolygon feature per contour", () => {
        const data = makeData([100, 200]);
        const geojson = contoursToGeoJson(data, toLngLat);
        expect(geojson.type).toBe("FeatureCollection");
        expect(geojson.features).toHaveLength(2);
        for (const feature of geojson.features) {
            expect(feature.type).toBe("Feature");
            expect(feature.geometry.type).toBe("MultiPolygon");
        }
        expect(geojson.features.map((f) => f.properties.elevation)).toEqual([100, 200]);
    });

    it("runs every coordinate through the converter", () => {
        const convert = vi.fn(toLngLat);
        const data = makeData([100], { contours: [square(100, 10, true)] });
        const geojson = contoursToGeoJson(data, convert);

        expect(convert).toHaveBeenCalledTimes(10);
        expect(convert).toHaveBeenCalledWith(10, 10);

        const [polygon] = geojson.features[0].geometry.coordinates;
        expect(polygon).toHaveLength(2);
        expect(polygon[0]).toEqual([
            [0, 5],
            [1, 5],
            [1, 4],
            [0, 4],
            [0, 5],
        ]);
        expect(polygon[1][0]).toEqual([0.2, 4.8]);
    });

    it("preserves a multi-part geometry", () => {
        const contour = square(50);
        contour.coordinates.push([
            [
                [20, 20],
                [30, 20],
                [30, 30],
                [20, 20],
            ],
        ]);
        const geojson = contoursToGeoJson(makeData([50], { contours: [contour] }), toLngLat);
        expect(geojson.features[0].geometry.coordinates).toHaveLength(2);
        expect(geojson.features[0].geometry.coordinates[1][0][1]).toEqual([3, 3]);
    });

    it("returns an empty collection for no contours", () => {
        expect(contoursToGeoJson(makeData([100], { contours: [] }), toLngLat)).toEqual({ type: "FeatureCollection", features: [] });
    });
});
