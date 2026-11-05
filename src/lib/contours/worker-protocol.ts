import type { ContourResult, Unit } from "./types";

/** A viewport's worth of Terrarium pixels, as read back from the offscreen canvas. */
export interface PixelGrid {
    /** RGBA pixels; its buffer is transferred to the worker, so don't read it afterwards. */
    pixels: Uint8ClampedArray<ArrayBuffer>;
    width: number;
    height: number;
}

export interface ContourWorkerRequest {
    id: number;
    /** A freshly rasterized grid. Omitted when only `interval` or `unit` changed; the worker then reuses the last grid it was sent. */
    grid?: PixelGrid;
    interval: number;
    unit: Unit;
}

export type ContourWorkerResponse = { id: number; result: ContourResult } | { id: number; error: string };
