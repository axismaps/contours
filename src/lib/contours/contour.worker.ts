import { computeContours } from "./compute";
import type { ContourWorkerRequest, ContourWorkerResponse, PixelGrid } from "./worker-protocol";

/**
 * Runs the elevation → thresholds → d3-contour pipeline off the main thread.
 * A thin wrapper around `computeContours`: it only keeps the last pixel grid
 * so that an interval or unit change doesn't need to re-send the pixels.
 */
let grid: PixelGrid | null = null;

addEventListener("message", (event: MessageEvent<ContourWorkerRequest>) => {
    const { id, interval, unit } = event.data;
    if (event.data.grid) grid = event.data.grid;

    let response: ContourWorkerResponse;
    try {
        response = { id, result: grid ? computeContours(grid.pixels, grid.width, grid.height, interval, unit) : { status: "empty" } };
    } catch (error) {
        response = { id, error: error instanceof Error ? error.message : String(error) };
    }
    postMessage(response);
});
