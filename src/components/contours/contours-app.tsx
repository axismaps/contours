"use client";

import { useCallback, useEffect, useState } from "react";
import { useContourMap } from "@/hooks/use-contour-map";
import { DEFAULT_SETTINGS } from "@/lib/contours/constants";
import type { PlaceResult } from "@/lib/contours/geocode";
import type { ContourSettings } from "@/lib/contours/types";
import { AppHeader } from "./app-header";
import { DownloadPanel } from "./download-panel";
import { MapView } from "./map-view";
import { SidePanel } from "./side-panel";
import { StylePanel } from "./style-panel";
import { type PanelId, ToolRail, railButtonId } from "./tool-rail";

/** Open the Style panel on first load where it won't cover the map. */
const initialPanel = (): PanelId | null => (typeof window !== "undefined" && window.matchMedia("(min-width: 720px)").matches ? "style" : null);

export const ContoursApp = () => {
    const [settings, setSettings] = useState<ContourSettings>(DEFAULT_SETTINGS);
    const [panel, setPanel] = useState<PanelId | null>(initialPanel);
    const map = useContourMap(settings);

    const updateSettings = useCallback((patch: Partial<ContourSettings>) => setSettings((current) => ({ ...current, ...patch })), []);
    const togglePanel = useCallback((id: PanelId) => setPanel((current) => (current === id ? null : id)), []);
    const closePanel = useCallback(() => setPanel(null), []);

    // Escape anywhere on the page closes the open panel and hands focus back to its rail
    // button. Listening on the window catches it even when nothing is focused; popovers
    // and menus handle their own Escape first and mark it handled.
    useEffect(() => {
        if (!panel) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape" || event.defaultPrevented) return;
            setPanel(null);
            document.getElementById(railButtonId(panel))?.focus();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [panel]);

    const goToPlace = useCallback(
        (place: PlaceResult) => {
            if (place.bbox) map.actions.fitBounds(place.bbox);
            else map.actions.setView({ lng: place.center[0], lat: place.center[1], zoom: 11 });
        },
        [map.actions],
    );

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden bg-primary">
            <AppHeader onSelectPlace={goToPlace} />

            <div className="flex min-h-0 flex-1">
                <ToolRail active={panel} onToggle={togglePanel} />

                <div className="relative min-w-0 flex-1">
                    {/* Panels come before the map in the DOM so Tab reaches their controls right after the rail. */}
                    <SidePanel id="style" title="Style" description="Interval, lines, tints and labels." isOpen={panel === "style"} onClose={closePanel}>
                        <StylePanel settings={settings} onChange={updateSettings} hasBathymetry={map.hasBathymetry} />
                    </SidePanel>
                    <SidePanel id="download" title="Download" description="Export what's on screen." isOpen={panel === "download"} onClose={closePanel}>
                        <DownloadPanel actions={map.actions} hasContours={map.hasContours} isDrawing={map.isDrawing} />
                    </SidePanel>

                    <MapView
                        containerRef={map.containerRef}
                        isDrawing={map.isDrawing}
                        problem={map.problem}
                        interval={settings.interval}
                        unit={settings.unit}
                        panelOpen={panel !== null}
                    />
                </div>
            </div>
        </div>
    );
};
