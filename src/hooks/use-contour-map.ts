"use client";

import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { CANVAS_BUFFER, ESRI_ATTRIBUTION, ESRI_PLACES_URL, ESRI_ROADS_URL, MAX_ZOOM, REDRAW_DELAY_MS, randomExampleLocation } from "@/lib/contours/constants";
import { ContourWorkerClient } from "@/lib/contours/contour-client";
import { contoursToSvg, drawContours, hasBathymetry } from "@/lib/contours/draw";
import { canvasToPngBlob, contoursToGeoJson, downloadBlob, downloadText } from "@/lib/contours/export";
import { formatHash, parseHash } from "@/lib/contours/hash";
import { TerrariumLayer } from "@/lib/contours/terrarium-layer";
import type { ContourData, ContourProblem, ContourResult, ContourSettings, MapPosition } from "@/lib/contours/types";
import type { PixelGrid } from "@/lib/contours/worker-protocol";

/**
 * How much work a pending redraw needs. A heavier request always wins over a
 * lighter one that is already waiting, so a style tweak can't cancel the
 * re-rasterization a pan asked for.
 */
const Work = { Draw: 0, Contours: 1, Relief: 2 } as const;
type Work = (typeof Work)[keyof typeof Work];

export interface ContourMapActions {
    setView: (position: MapPosition) => void;
    fitBounds: (bbox: [number, number, number, number]) => void;
    downloadGeoJson: () => void;
    downloadPng: () => Promise<void>;
    downloadSvg: () => void;
}

export interface ContourMap {
    containerRef: RefObject<HTMLDivElement | null>;
    /** True from the moment a redraw is scheduled until its contours are on screen. */
    isDrawing: boolean;
    /** Why the current view has no contours, when that is worth telling the user. */
    problem: ContourProblem | null;
    /** True when the current view contains elevations below sea level. */
    hasBathymetry: boolean;
    actions: ContourMapActions;
}

/** Settings that change the computed contours rather than just how they're drawn. */
const needsRecompute = (a: ContourSettings, b: ContourSettings) => a.interval !== b.interval || a.unit !== b.unit;

/**
 * Owns the Leaflet map, the hidden elevation layer, the reference overlay and
 * the contour canvas. Re-runs the elevation → contours → canvas pipeline,
 * debounced, whenever the view or the settings change. Rasterizing the tiles
 * and drawing happen here; decoding and contouring run in a Web Worker.
 */
export function useContourMap(settings: ContourSettings): ContourMap {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const demLayerRef = useRef<TerrariumLayer | null>(null);
    const referenceLayerRef = useRef<L.LayerGroup | null>(null);
    const contourCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const demCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const dataRef = useRef<ContourData | null>(null);
    const workerRef = useRef<ContourWorkerClient | null>(null);

    const settingsRef = useRef(settings);
    const previousSettingsRef = useRef<ContourSettings | null>(null);
    const timerRef = useRef<number | null>(null);
    const pendingWorkRef = useRef<Work>(Work.Draw);
    /** Bumped when the view changes, so contours computed for the old view are dropped when they arrive. */
    const generationRef = useRef(0);
    /** Worker requests posted but not yet answered. */
    const inFlightRef = useRef(0);

    const [isDrawing, setIsDrawing] = useState(false);
    const [bathymetry, setBathymetry] = useState(false);
    const [problem, setProblem] = useState<ContourProblem | null>(null);

    const gridSize = () => {
        const size = mapRef.current?.getSize() ?? L.point(0, 0);
        return { width: size.x + 2 * CANVAS_BUFFER, height: size.y + 2 * CANVAS_BUFFER };
    };

    /** Pin the contour canvas back to the top-left of the viewport after the map pane has moved. */
    const resetCanvasPosition = () => {
        const map = mapRef.current;
        const canvas = contourCanvasRef.current;
        if (!map || !canvas) return;
        L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([-CANVAS_BUFFER, -CANVAS_BUFFER]));
    };

    const draw = () => {
        const canvas = contourCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        const data = dataRef.current;
        if (!canvas || !ctx) return;
        if (!data) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        drawContours(ctx, data, settingsRef.current);
    };

    /** Hide the status card once nothing is waiting or in flight. */
    const settle = () => {
        if (timerRef.current === null && inFlightRef.current === 0) setIsDrawing(false);
    };

    const applyResult = (result: ContourResult) => {
        dataRef.current = result.status === "ok" ? result.data : null;
        setProblem(result.status === "failed" ? result.problem : null);
        setBathymetry(dataRef.current ? hasBathymetry(dataRef.current) : false);
        draw();
    };

    /** Draw the loaded tiles onto the offscreen canvas and read the pixels back. */
    const rasterizeRelief = (): PixelGrid | null => {
        const map = mapRef.current;
        const demLayer = demLayerRef.current;
        const demCanvas = demCanvasRef.current;
        const container = containerRef.current;
        const ctx = demCanvas?.getContext("2d", { willReadFrequently: true });
        if (!map || !demLayer || !demCanvas || !ctx || !container) return null;

        const { width, height } = gridSize();
        ctx.clearRect(0, 0, width, height);
        resetCanvasPosition();
        demLayer.rasterize(ctx, container, map.getZoom(), CANVAS_BUFFER);
        return { pixels: ctx.getImageData(0, 0, width, height).data, width, height };
    };

    /** Post a contour computation to the worker; a new grid is sent only after re-rasterizing. */
    const requestContours = (grid: PixelGrid | null) => {
        const worker = workerRef.current;
        if (!worker) return;
        const generation = generationRef.current;
        const { interval, unit } = settingsRef.current;
        inFlightRef.current++;
        worker
            .compute({ grid: grid ?? undefined, interval, unit })
            .then(
                (result) => {
                    // The map moved (or unmounted) while this was computing; its result belongs to the old view.
                    if (generation !== generationRef.current || !mapRef.current) return;
                    applyResult(result);
                },
                (error: unknown) => {
                    if (generation !== generationRef.current || !mapRef.current) return;
                    console.error("Contour computation failed", error);
                    applyResult({ status: "empty" });
                },
            )
            .finally(() => {
                inFlightRef.current--;
                settle();
            });
    };

    const runWork = (work: Work) => {
        if (work === Work.Relief) {
            const grid = rasterizeRelief();
            if (grid) requestContours(grid);
        } else if (work === Work.Contours) {
            requestContours(null);
        } else {
            draw();
        }
        settle();
    };

    const cancelPending = () => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    /** Debounce a redraw; the heaviest requested level of work is what runs. */
    const schedule = (work: Work) => {
        pendingWorkRef.current = Math.max(pendingWorkRef.current, work) as Work;
        // A re-rasterization means the view changed: anything still computing is for the old one.
        if (work === Work.Relief) generationRef.current++;
        cancelPending();
        setIsDrawing(true);
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            const pending = pendingWorkRef.current;
            pendingWorkRef.current = Work.Draw;
            runWork(pending);
        }, REDRAW_DELAY_MS);
    };

    // Keep the latest settings reachable from the scheduled callbacks.
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    // Create the map once.
    useEffect(() => {
        const container = containerRef.current;
        if (!container || mapRef.current) return;

        const map = L.map(container, { scrollWheelZoom: false, zoomControl: false, maxZoom: MAX_ZOOM });
        mapRef.current = map;
        workerRef.current = new ContourWorkerClient();
        L.control.zoom({ position: "topright" }).addTo(map);

        const demLayer = new TerrariumLayer(() => schedule(Work.Relief));
        demLayerRef.current = demLayer;
        demLayer.addTo(map);

        const contourPane = map.createPane("contour");
        contourPane.style.zIndex = "400";
        const contourCanvas = document.createElement("canvas");
        contourCanvas.id = "contours";
        contourCanvas.style.position = "absolute";
        contourCanvas.style.top = "0";
        contourCanvas.style.left = "0";
        contourPane.appendChild(contourCanvas);
        contourCanvasRef.current = contourCanvas;
        demCanvasRef.current = document.createElement("canvas");

        const labelPane = map.createPane("labels");
        labelPane.style.zIndex = "450";
        labelPane.style.pointerEvents = "none";
        const roads = L.tileLayer(ESRI_ROADS_URL, { maxZoom: MAX_ZOOM, pane: "labels", opacity: 0.5, attribution: ESRI_ATTRIBUTION });
        const places = L.tileLayer(ESRI_PLACES_URL, { maxZoom: MAX_ZOOM, pane: "labels" });
        const referenceLayer = L.layerGroup([roads, places]);
        referenceLayerRef.current = referenceLayer;
        if (settingsRef.current.showLabels) referenceLayer.addTo(map);

        const resizeCanvases = () => {
            const { width, height } = gridSize();
            for (const canvas of [contourCanvas, demCanvasRef.current]) {
                if (!canvas) continue;
                canvas.width = width;
                canvas.height = height;
            }
        };
        resizeCanvases();

        const syncHash = () => {
            const center = map.getCenter();
            const hash = formatHash({ zoom: map.getZoom(), lat: center.lat, lng: center.lng });
            if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
        };
        const onHashChange = () => {
            const position = parseHash(window.location.hash);
            if (!position) return;
            const center = map.getCenter();
            const unchanged = map.getZoom() === position.zoom && Math.abs(center.lat - position.lat) < 1e-6 && Math.abs(center.lng - position.lng) < 1e-6;
            if (!unchanged) map.setView([position.lat, position.lng], position.zoom);
        };

        map.on("move", cancelPending);
        map.on("moveend", () => {
            // Clear right away; stale contours sliding around are worse than a blank map.
            contourCanvas.getContext("2d")?.clearRect(0, 0, contourCanvas.width, contourCanvas.height);
            syncHash();
            schedule(Work.Relief);
        });
        map.on("resize", () => {
            resizeCanvases();
            schedule(Work.Relief);
        });
        window.addEventListener("hashchange", onHashChange);

        const start = parseHash(window.location.hash) ?? randomExampleLocation();
        map.setView([start.lat, start.lng], start.zoom);
        resetCanvasPosition();

        return () => {
            cancelPending();
            // A counter, not a DOM node: bumping it here is what drops results that arrive after unmount.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            generationRef.current++;
            window.removeEventListener("hashchange", onHashChange);
            workerRef.current?.terminate();
            workerRef.current = null;
            map.remove();
            mapRef.current = null;
            demLayerRef.current = null;
            referenceLayerRef.current = null;
            contourCanvasRef.current = null;
            demCanvasRef.current = null;
            dataRef.current = null;
        };
        // The map is created once; later changes flow through refs and the settings effect.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // React to setting changes.
    useEffect(() => {
        const previous = previousSettingsRef.current;
        previousSettingsRef.current = settings;
        if (!previous) return;

        const map = mapRef.current;
        const referenceLayer = referenceLayerRef.current;
        if (map && referenceLayer && previous.showLabels !== settings.showLabels) {
            if (settings.showLabels) referenceLayer.addTo(map);
            else referenceLayer.removeFrom(map);
        }

        if (needsRecompute(previous, settings)) schedule(Work.Contours);
        else if (previous !== settings) schedule(Work.Draw);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    const setView = useCallback(({ lat, lng, zoom }: MapPosition) => {
        mapRef.current?.setView([lat, lng], zoom);
    }, []);

    const fitBounds = useCallback(([west, south, east, north]: [number, number, number, number]) => {
        mapRef.current?.fitBounds([
            [south, west],
            [north, east],
        ]);
    }, []);

    const downloadGeoJson = useCallback(() => {
        const map = mapRef.current;
        const data = dataRef.current;
        if (!map || !data) return;
        const geojson = contoursToGeoJson(data, (x, y) => {
            const ll = map.containerPointToLatLng([x - CANVAS_BUFFER, y - CANVAS_BUFFER]);
            return [ll.lng, ll.lat];
        });
        downloadText(JSON.stringify(geojson), "contours.geojson", "application/geo+json");
    }, []);

    const downloadPng = useCallback(async () => {
        const canvas = contourCanvasRef.current;
        if (!canvas) return;
        downloadBlob(await canvasToPngBlob(canvas, CANVAS_BUFFER), "contours.png");
    }, []);

    const downloadSvg = useCallback(() => {
        const data = dataRef.current;
        if (!data) return;
        downloadText(contoursToSvg(data, settingsRef.current, CANVAS_BUFFER), "contours.svg", "image/svg+xml;charset=utf-8");
    }, []);

    const actions = useMemo<ContourMapActions>(
        () => ({ setView, fitBounds, downloadGeoJson, downloadPng, downloadSvg }),
        [setView, fitBounds, downloadGeoJson, downloadPng, downloadSvg],
    );

    return { containerRef, isDrawing, problem, hasBathymetry: bathymetry, actions };
}
