import type { ContourMultiPolygon } from "d3-contour";
import { geoPath } from "d3-geo";
import { type ColorScale, hexWithAlpha, makeBathyScale, makeHypsoScale } from "./color";
import type { BathymetryType, ContourData, ContourSettings } from "./types";

/** Fixed stroke and shadow used below sea level in illuminated mode. */
const UNDERWATER_SHADOW = "#4e5c66";
const UNDERWATER_HIGHLIGHT = "rgba(224,242,255,0.5)";
/** In illuminated mode the fill can't be transparent, so "none" is white. */
const ILLUMINATED_DEFAULT_FILL = "#fff";

interface ResolvedStyle {
    settings: ContourSettings;
    /** Bathymetry only applies when the view actually dips below sea level. */
    bathymetry: BathymetryType;
    hypso: ColorScale;
    bathy: ColorScale;
    /** Elevation step between index lines, or 0 for none. */
    indexInterval: number;
    highlight: string;
}

export const hasBathymetry = (data: ContourData): boolean => data.min < 0;

export function resolveStyle(data: ContourData, settings: ContourSettings): ResolvedStyle {
    const bathymetry = hasBathymetry(data) ? settings.bathymetry : "none";
    // When the sea floor is colored separately the land tints start at sea level.
    const hypsoDomain: [number, number] = bathymetry !== "none" ? [0, data.max] : [data.min, data.max];
    return {
        settings,
        bathymetry,
        hypso: makeHypsoScale(settings.hypsoLowColor, settings.hypsoHighColor, hypsoDomain),
        bathy: makeBathyScale(settings.bathyDeepColor, settings.bathyShallowColor, [data.min, -1]),
        indexInterval: settings.mapType === "lines" ? settings.indexEvery * settings.interval : 0,
        highlight: hexWithAlpha(settings.highlightColor, 0.5),
    };
}

/** The fill for one contour polygon, or null for no fill. */
export function fillFor(value: number, style: ResolvedStyle): string | null {
    const { settings, bathymetry } = style;
    if (value >= 0 || bathymetry === "none") {
        if (settings.background === "hypso") return style.hypso(value);
        if (settings.background === "solid") return settings.solidColor;
        // Mask the sea floor with white when it is colored but the land isn't.
        return bathymetry !== "none" ? "#fff" : null;
    }
    if (bathymetry === "bathy") return style.bathy(value);
    if (bathymetry === "solid") return settings.oceanColor;
    return null;
}

const isIndexLine = (value: number, indexInterval: number) => indexInterval !== 0 && value % indexInterval === 0;

/**
 * Draw the contours onto a canvas the size of `data.width` × `data.height`.
 * `pixelRatio` is the scale already applied to `ctx` when rendering at a
 * higher resolution; canvas shadows ignore the transform, so they need it.
 */
export function drawContours(ctx: CanvasRenderingContext2D, data: ContourData, settings: ContourSettings, pixelRatio = 1): void {
    const style = resolveStyle(data, settings);
    const path = geoPath<unknown, ContourMultiPolygon>().context(ctx);
    const { contours } = data;

    ctx.clearRect(0, 0, data.width, data.height);
    ctx.save();
    ctx.lineJoin = "round";

    if (settings.mapType === "illuminated") {
        // A light stroke first, then the fill with a drop shadow: one edge of each
        // band reads as lit and the other as shaded, so the terrain looks raised.
        ctx.lineWidth = settings.shadowWidth + 1;
        ctx.shadowBlur = settings.shadowWidth * pixelRatio;
        ctx.shadowOffsetX = settings.shadowWidth * pixelRatio;
        ctx.shadowOffsetY = settings.shadowWidth * pixelRatio;

        for (const c of contours) {
            const underwater = c.value < 0 && style.bathymetry !== "none";
            ctx.beginPath();
            ctx.shadowColor = underwater ? UNDERWATER_SHADOW : settings.shadowColor;
            ctx.strokeStyle = underwater ? UNDERWATER_HIGHLIGHT : style.highlight;
            ctx.fillStyle = fillFor(c.value, style) ?? ILLUMINATED_DEFAULT_FILL;
            path(c);
            ctx.stroke();
            ctx.fill();
        }
    } else {
        ctx.lineWidth = settings.lineWidth;
        ctx.strokeStyle = settings.lineColor;

        if (settings.background !== "hypso" && style.bathymetry === "none") {
            // No fill or one solid fill: every contour can go into a single path.
            ctx.beginPath();
            for (const c of contours) {
                if (!isIndexLine(c.value, style.indexInterval)) path(c);
            }
            if (settings.background === "solid") {
                ctx.fillStyle = settings.solidColor;
                ctx.fill();
            }
            ctx.stroke();
        } else {
            // Tints differ per contour, so fill and stroke them one at a time.
            for (const c of contours) {
                ctx.beginPath();
                path(c);
                const fill = fillFor(c.value, style);
                if (fill) {
                    ctx.fillStyle = fill;
                    ctx.fill();
                }
                ctx.stroke();
            }
        }

        if (style.indexInterval !== 0) {
            ctx.lineWidth = settings.indexLineWidth;
            ctx.beginPath();
            for (const c of contours) {
                if (isIndexLine(c.value, style.indexInterval)) path(c);
            }
            ctx.stroke();
        }
    }

    ctx.restore();
}

const escapeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * Serialize the contours as an SVG document cropped to the viewport, one
 * `<path>` per contour with the stroke and fill of the current style.
 */
export function contoursToSvg(data: ContourData, settings: ContourSettings, buffer: number): string {
    const style = resolveStyle(data, settings);
    const path = geoPath<unknown, ContourMultiPolygon>();
    const width = data.width - 2 * buffer;
    const height = data.height - 2 * buffer;
    const lines = settings.mapType === "lines";

    const paths = data.contours.map((c) => {
        const d = path(c);
        if (!d) return "";
        const strokeWidth = lines ? (isIndexLine(c.value, style.indexInterval) ? settings.indexLineWidth : settings.lineWidth) : settings.shadowWidth;
        const stroke = lines ? settings.lineColor : style.highlight;
        const fill = fillFor(c.value, style) ?? "none";
        return `<path id="elev-${c.value}" d="${d}" stroke="${escapeAttribute(stroke)}" stroke-width="${strokeWidth}" fill="${escapeAttribute(fill)}"/>`;
    });

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
        `<g transform="translate(${-buffer} ${-buffer})" stroke-linejoin="round">`,
        ...paths,
        "</g>",
        "</svg>",
    ].join("\n");
}
