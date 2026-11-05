"use client";

import type { RefObject } from "react";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { suggestInterval } from "@/lib/contours/thresholds";
import type { ContourProblem, Unit } from "@/lib/contours/types";
import { cx } from "@/utils/cx";

interface MapViewProps {
    containerRef: RefObject<HTMLDivElement | null>;
    isDrawing: boolean;
    problem: ContourProblem | null;
    /** The interval the problem was computed at, for the suggestion in the message. */
    interval: number;
    unit: Unit;
    /** Whether a side panel is open; the status cards then centre over the visible map. */
    panelOpen: boolean;
}

const describeProblem = (problem: ContourProblem, interval: number, unit: Unit): string => {
    switch (problem.kind) {
        case "too-many-thresholds": {
            const suggestion = suggestInterval(problem.count, problem.limit, interval);
            return `Too many contour lines for this view: ${problem.count.toLocaleString()} at ${interval.toLocaleString()} ${unit}, and the limit is ${problem.limit.toLocaleString()}. Try an interval of ${suggestion.toLocaleString()} ${unit} or more.`;
        }
    }
};

const cardClass =
    "flex items-center gap-3 rounded-xl bg-primary py-2.5 pr-4 pl-3 shadow-lg ring-1 ring-secondary_alt duration-150 animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none";

/** The Leaflet container plus floating status cards: "Drawing contours" and why a view has none. */
export const MapView = ({ containerRef, isDrawing, problem, interval, unit, panelOpen }: MapViewProps) => (
    <>
        <div ref={containerRef} className="absolute inset-0 z-0 bg-primary" />
        <div
            role="status"
            aria-live="polite"
            className={cx(
                "pointer-events-none absolute top-4 right-0 left-0 z-10 flex flex-col items-center gap-2 px-4",
                "transition-[left] duration-300 ease-out motion-reduce:transition-none",
                // Matches the side panel's width and the breakpoint above which it leaves map visible beside it.
                panelOpen && "min-[720px]:left-80",
            )}
        >
            {isDrawing && (
                <div className={cardClass}>
                    <LoadingIndicator size="sm" />
                    <span className="text-sm font-medium text-secondary">Drawing contours…</span>
                </div>
            )}
            {problem && !isDrawing && (
                <div className={`${cardClass} max-w-sm`}>
                    <span className="text-center text-sm font-medium text-error-primary">{describeProblem(problem, interval, unit)}</span>
                </div>
            )}
        </div>
    </>
);
