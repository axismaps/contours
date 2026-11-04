import type { Feature, FeatureCollection, MultiPolygon, Position } from "geojson";
import type { ContourData } from "./types";

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

/** Copy the canvas without its buffer margin and encode it as a PNG. */
export function canvasToPngBlob(source: HTMLCanvasElement, buffer: number): Promise<Blob> {
    const cropped = document.createElement("canvas");
    cropped.width = source.width - 2 * buffer;
    cropped.height = source.height - 2 * buffer;
    const ctx = cropped.getContext("2d");
    if (!ctx) return Promise.reject(new Error("Canvas 2D context unavailable"));
    ctx.drawImage(source, -buffer, -buffer);
    return new Promise((resolve, reject) => {
        cropped.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))), "image/png");
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
