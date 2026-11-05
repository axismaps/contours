"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brush01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useContourMap } from "@/hooks/use-contour-map";
import { DEFAULT_SETTINGS } from "@/lib/contours/constants";
import type { PlaceResult } from "@/lib/contours/geocode";
import type { ContourSettings } from "@/lib/contours/types";
import { AppHeader } from "./app-header";
import { MapView } from "./map-view";
import { StylePanel } from "./style-panel";
import { STYLE_CLOSE_BUTTON_ID, STYLE_OPEN_BUTTON_ID, STYLE_PANEL_ID, StyleSidebar } from "./style-sidebar";

/** Start with the Style panel open where it sits beside the map rather than over it. */
const initialStyleOpen = (): boolean => typeof window !== "undefined" && window.matchMedia("(min-width: 720px)").matches;

export const ContoursApp = () => {
    const [settings, setSettings] = useState<ContourSettings>(DEFAULT_SETTINGS);
    const [styleOpen, setStyleOpen] = useState(initialStyleOpen);
    /** Which button to focus once the panel has opened or closed; the other one only exists then. */
    const focusAfterToggle = useRef<string | null>(null);
    const map = useContourMap(settings);

    const updateSettings = useCallback((patch: Partial<ContourSettings>) => setSettings((current) => ({ ...current, ...patch })), []);

    const openStyle = useCallback(() => {
        focusAfterToggle.current = STYLE_CLOSE_BUTTON_ID;
        setStyleOpen(true);
    }, []);
    const closeStyle = useCallback(() => {
        focusAfterToggle.current = STYLE_OPEN_BUTTON_ID;
        setStyleOpen(false);
    }, []);

    useEffect(() => {
        const id = focusAfterToggle.current;
        focusAfterToggle.current = null;
        if (!id) return;
        // After the press that toggled the panel has finished, since the pressed button
        // otherwise takes focus back. A timer rather than an animation frame, which
        // never fires while the tab is in the background.
        const timer = window.setTimeout(() => document.getElementById(id)?.focus(), 0);
        return () => window.clearTimeout(timer);
    }, [styleOpen]);

    // Escape anywhere on the page closes the panel. Listening on the window catches it even
    // when nothing is focused; popovers and menus handle their own Escape first and mark it handled.
    useEffect(() => {
        if (!styleOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !event.defaultPrevented) closeStyle();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [styleOpen, closeStyle]);

    const goToPlace = useCallback(
        (place: PlaceResult) => {
            if (place.bbox) map.actions.fitBounds(place.bbox);
            else map.actions.setView({ lng: place.center[0], lat: place.center[1], zoom: 11 });
        },
        [map.actions],
    );

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden bg-primary">
            <AppHeader onSelectPlace={goToPlace} actions={map.actions} hasContours={map.hasContours} isDrawing={map.isDrawing} />

            <div className="relative flex min-h-0 flex-1">
                <StyleSidebar isOpen={styleOpen} onClose={closeStyle}>
                    <StylePanel settings={settings} onChange={updateSettings} hasBathymetry={map.hasBathymetry} />
                </StyleSidebar>

                <div className="relative min-w-0 flex-1">
                    <MapView
                        containerRef={map.containerRef}
                        isDrawing={map.isDrawing}
                        problem={map.problem}
                        interval={settings.interval}
                        unit={settings.unit}
                    />
                    {!styleOpen && (
                        <Button
                            id={STYLE_OPEN_BUTTON_ID}
                            color="secondary"
                            size="sm"
                            iconLeading={Brush01}
                            aria-controls={STYLE_PANEL_ID}
                            aria-expanded={false}
                            onPress={openStyle}
                            className="absolute top-4 left-4 z-10 shadow-lg"
                        >
                            Style
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
