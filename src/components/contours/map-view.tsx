"use client";

import type { RefObject } from "react";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import type { ContourProblem } from "@/lib/contours/types";

interface MapViewProps {
    containerRef: RefObject<HTMLDivElement | null>;
    isDrawing: boolean;
    problem: ContourProblem | null;
}

const describeProblem = (problem: ContourProblem): string => {
    switch (problem.kind) {
        case "too-many-thresholds":
            return `Too many contour lines for this view (${problem.count.toLocaleString()}; the limit is ${problem.limit.toLocaleString()}). Try a larger interval.`;
    }
};

const cardClass =
    "flex items-center gap-3 rounded-xl bg-primary py-2.5 pr-4 pl-3 shadow-lg ring-1 ring-secondary_alt duration-150 animate-in fade-in slide-in-from-top-1";

/** The Leaflet container plus floating status cards: "Drawing contours" and why a view has none. */
export const MapView = ({ containerRef, isDrawing, problem }: MapViewProps) => (
    <>
        <div ref={containerRef} className="absolute inset-0 z-0 bg-primary" />
        <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-4 z-10 flex flex-col items-center gap-2 px-4">
            {isDrawing && (
                <div className={cardClass}>
                    <LoadingIndicator size="sm" />
                    <span className="text-sm font-medium text-secondary">Drawing contours…</span>
                </div>
            )}
            {problem && !isDrawing && (
                <div className={`${cardClass} max-w-sm`}>
                    <span className="text-center text-sm font-medium text-error-primary">{describeProblem(problem)}</span>
                </div>
            )}
        </div>
    </>
);
