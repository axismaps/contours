import type { ContourMultiPolygon } from "d3-contour";

export type MapType = "lines" | "illuminated";
export type Unit = "ft" | "m";
export type BackgroundType = "none" | "solid" | "hypso";
export type BathymetryType = "none" | "solid" | "bathy";
export type IndexEvery = 0 | 2 | 5 | 10;

/** Everything the user can change in the Style panel. */
export interface ContourSettings {
    showLabels: boolean;
    mapType: MapType;
    /** Contour interval in `unit`. */
    interval: number;
    unit: Unit;
    /** Draw a heavier index line every N intervals (0 = none). Lines mode only. */
    indexEvery: IndexEvery;

    lineColor: string;
    lineWidth: number;
    indexLineWidth: number;

    /** Illuminated mode: light stroke (drawn at 50% alpha), dark drop shadow and its width. */
    highlightColor: string;
    shadowColor: string;
    shadowWidth: number;

    background: BackgroundType;
    solidColor: string;
    hypsoLowColor: string;
    hypsoHighColor: string;

    bathymetry: BathymetryType;
    oceanColor: string;
    bathyDeepColor: string;
    bathyShallowColor: string;
}

/** The result of one contour computation over the current viewport. */
export interface ContourData {
    contours: ContourMultiPolygon[];
    /** Lowest and highest contour threshold, in `unit`. */
    min: number;
    max: number;
    interval: number;
    unit: Unit;
    /** Size of the pixel grid the contours were computed on (viewport plus buffer on each side). */
    width: number;
    height: number;
}

export interface MapPosition {
    lat: number;
    lng: number;
    zoom: number;
}
