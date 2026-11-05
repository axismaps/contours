"use client";

import type { RefObject } from "react";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { suggestInterval } from "@/lib/contours/thresholds";
import type { ContourProblem, Unit } from "@/lib/contours/types";

interface MapViewProps {
    containerRef: RefObject<HTMLDivElement | null>;
    isDrawing: boolean;
    problem: ContourProblem | null;
    /** The interval the problem was computed at, for the suggestion in the message. */
    interval: number;
    unit: Unit;
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
export const MapView = ({ containerRef, isDrawing, problem, interval, unit }: MapViewProps) => (
    <>
        <div ref={containerRef} aria-busy={isDrawing} className="absolute inset-0 z-0 bg-primary" />
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex flex-col items-center gap-2 px-4">
            {isDrawing && (
                <div className={cardClass}>
                    <LoadingIndicator size="sm" />
                    <span className="text-sm font-medium text-secondary">Drawing contours…</span>
                </div>
            )}
            {/* Only problems are announced; the busy card would otherwise be read out on every pan. */}
            <div role="status" aria-live="polite" className="contents">
                {problem && !isDrawing && (
                    <div className={`${cardClass} max-w-sm`}>
                        <span className="text-center text-sm font-medium text-error-primary">{describeProblem(problem, interval, unit)}</span>
                    </div>
                )}
            </div>
        </div>
    </>
);
