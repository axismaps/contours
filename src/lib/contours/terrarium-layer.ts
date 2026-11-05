import L from "leaflet";
import { MAX_ZOOM, TERRARIUM_ATTRIBUTION, TERRARIUM_TILE_URL } from "./constants";

/** Shape of Leaflet's private per-tile record, which is the only way to walk the loaded tiles. */
interface InternalTile {
    el: HTMLElement;
    coords: L.Coords;
    current: boolean;
}

/**
 * A grid layer that fetches Mapzen Terrarium PNGs but never shows them. Each
 * tile is an empty div; the decoded image is kept aside so it can be drawn to
 * an offscreen canvas and read back as elevation data.
 */
export class TerrariumLayer extends L.GridLayer {
    private readonly images = new WeakMap<HTMLElement, HTMLImageElement>();

    constructor(private readonly onTileSettled: () => void) {
        super({ maxZoom: MAX_ZOOM, attribution: TERRARIUM_ATTRIBUTION });
    }

    protected createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
        const tile = L.DomUtil.create("div", "leaflet-tile");
        const img = new Image();
        img.crossOrigin = "anonymous";
        this.images.set(tile, img);
        img.onload = () => {
            done(undefined, tile);
            this.onTileSettled();
        };
        img.onerror = () => {
            // A missing tile must not stall the redraw.
            done(new Error(`Tile ${coords.z}/${coords.x}/${coords.y} failed`), tile);
            this.onTileSettled();
        };
        img.src = L.Util.template(TERRARIUM_TILE_URL, { z: coords.z, x: coords.x, y: coords.y });
        return tile;
    }

    /**
     * Draw every loaded tile of the given zoom onto `ctx`, positioned relative to
     * the map container and shifted by `buffer` pixels.
     */
    rasterize(ctx: CanvasRenderingContext2D, container: HTMLElement, zoom: number, buffer: number): void {
        const tiles = (this as unknown as { _tiles: Record<string, InternalTile> })._tiles;
        const mapRect = container.getBoundingClientRect();
        for (const key in tiles) {
            const tile = tiles[key];
            if (tile.coords.z !== zoom) continue;
            const img = this.images.get(tile.el);
            if (!img || !img.complete || !img.naturalWidth) continue;
            const rect = tile.el.getBoundingClientRect();
            ctx.drawImage(img, rect.left - mapRect.left + buffer, rect.top - mapRect.top + buffer, rect.width, rect.height);
        }
    }
}
