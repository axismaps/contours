"use client";

import type { ReactNode } from "react";
import { CloseButton } from "@/components/base/buttons/close-button";
import { cx } from "@/utils/cx";
import type { PanelId } from "./tool-rail";

interface SidePanelProps {
    id: PanelId;
    title: string;
    description: string;
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

/**
 * A panel for the Style and Download tools. From 720px up it slides out
 * beside the rail and leaves the map visible next to it; below that it is a
 * bottom sheet over the lower half of the map, so changes stay visible.
 * Closed, it is off-screen and inert.
 */
export const SidePanel = ({ id, title, description, isOpen, onClose, children }: SidePanelProps) => (
    <section
        id={`${id}-panel`}
        aria-labelledby={`${id}-panel-title`}
        inert={!isOpen}
        className={cx(
            "absolute inset-x-0 bottom-0 z-10 flex h-[55dvh] flex-col overflow-y-auto overscroll-contain rounded-t-2xl bg-primary shadow-xl ring-1 ring-secondary_alt",
            "min-[720px]:inset-y-0 min-[720px]:right-auto min-[720px]:h-auto min-[720px]:w-80 min-[720px]:rounded-none",
            "transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none",
            isOpen
                ? "visible translate-x-0 translate-y-0 delay-0"
                : "invisible translate-y-full delay-[0s,300ms] motion-reduce:delay-0 min-[720px]:-translate-x-full min-[720px]:translate-y-0",
        )}
    >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-quaternary min-[720px]:hidden" />
        <div className="relative flex flex-col gap-0.5 px-5 pt-4 pb-5 min-[720px]:pt-5">
            <h2 id={`${id}-panel-title`} className="text-lg font-semibold text-primary">
                {title}
            </h2>
            <p className="text-sm text-tertiary">{description}</p>
            <CloseButton slot={null} size="md" label="Close panel" onPress={onClose} className="absolute top-3 right-3" />
        </div>
        {children}
    </section>
);
