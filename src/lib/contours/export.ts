import type { Feature, FeatureCollection, MultiPolygon, Position } from "geojson";
import { drawContours } from "./draw";
import type { ContourData, ContourSettings } from "./types";

export type PixelToLngLat = (x: number, y: number) => [number, number];

/**
 * Convert the contours to GeoJSON: one MultiPolygon feature per contour with
 * an `elevation` property, using `toLngLat` to turn canvas pixels into
 * longitude/latitude.
 */
export function contoursToGeoJson(data: ContourData, toLngLat: PixelToLngLat): FeatureCollection<MultiPolygon, { elevation: number }> {
    const features: Feature<MultiPolygon, { elevation: number }>[] = data.contours.map((c) => ({
        type: "Feature",
        properties: { elevation: c.value },
        geometry: {
            type: "MultiPolygon",
            coordinates: c.coordinates.map((polygon) => polygon.map((ring) => ring.map(([x, y]): Position => toLngLat(x, y)))),
        },
    }));
    return { type: "FeatureCollection", features };
}

/**
 * Render the contours to a PNG cropped to the viewport, at `pixelRatio` times
 * the on-screen size. Transparent wherever the style has no fill.
 */
export function contoursToPngBlob(data: ContourData, settings: ContourSettings, buffer: number, pixelRatio: number): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((data.width - 2 * buffer) * pixelRatio);
    canvas.height = Math.round((data.height - 2 * buffer) * pixelRatio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.reject(new Error("Canvas 2D context unavailable"));
    ctx.scale(pixelRatio, pixelRatio);
    ctx.translate(-buffer, -buffer);
    drawContours(ctx, data, settings, pixelRatio);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))), "image/png");
    });
}

/** Trigger a browser download of a blob. */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Give the browser a moment to start the download before releasing the URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadText = (text: string, filename: string, mime: string): void => downloadBlob(new Blob([text], { type: mime }), filename);
