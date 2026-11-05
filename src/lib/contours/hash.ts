import type { MapPosition } from "./types";

/** Parse a `#zoom/lat/lng` hash. Returns null for anything else. */
export function parseHash(hash: string): MapPosition | null {
    const parts = hash.replace(/^#/, "").split("/");
    if (parts.length !== 3) return null;
    const zoom = parseInt(parts[0], 10);
    const lat = parseFloat(parts[1]);
    const lng = parseFloat(parts[2]);
    if (!Number.isFinite(zoom) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90) return null;
    return { zoom, lat, lng };
}

/** Format a position as `#zoom/lat/lng`, with precision that suits the zoom. */
export function formatHash({ zoom, lat, lng }: MapPosition): string {
    const precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
    return `#${parseFloat(zoom.toFixed(5))}/${lat.toFixed(precision)}/${lng.toFixed(precision)}`;
}
