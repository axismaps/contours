"use client";

import type { RefObject } from "react";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";

interface MapViewProps {
    containerRef: RefObject<HTMLDivElement | null>;
    isDrawing: boolean;
}

/** The Leaflet container plus a floating "Drawing contours" status card. */
export const MapView = ({ containerRef, isDrawing }: MapViewProps) => (
    <>
        <div ref={containerRef} className="absolute inset-0 z-0 bg-primary" />
        <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
            {isDrawing && (
                <div className="flex items-center gap-3 rounded-xl bg-primary py-2.5 pr-4 pl-3 shadow-lg ring-1 ring-secondary_alt duration-150 animate-in fade-in slide-in-from-top-1">
                    <LoadingIndicator size="sm" />
                    <span className="text-sm font-medium text-secondary">Drawing contours…</span>
                </div>
            )}
        </div>
    </>
);
