"use client";

import type { ReactNode } from "react";
import { CloseButton } from "@/components/base/buttons/close-button";
import { cx } from "@/utils/cx";

export const STYLE_PANEL_ID = "style-panel";
export const STYLE_OPEN_BUTTON_ID = "style-open-button";
export const STYLE_CLOSE_BUTTON_ID = "style-close-button";

interface StyleSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

/**
 * The Style panel. From 720px up it is a column beside the map that collapses
 * to nothing; below that it is a bottom sheet over the lower half of the map,
 * so changes stay visible. Closed, it is off-screen and inert.
 */
export const StyleSidebar = ({ isOpen, onClose, children }: StyleSidebarProps) => (
    <section
        id={STYLE_PANEL_ID}
        aria-labelledby="style-panel-title"
        inert={!isOpen}
        className={cx(
            // Phone: a bottom sheet over the map.
            "absolute inset-x-0 bottom-0 z-10 flex h-[55dvh] flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-2xl bg-primary shadow-xl ring-1 ring-secondary_alt",
            "duration-300 ease-out motion-reduce:transition-none",
            // Desktop: a column in the flow beside the map, collapsing by width.
            "min-[720px]:static min-[720px]:h-auto min-[720px]:shrink-0 min-[720px]:translate-y-0 min-[720px]:rounded-none min-[720px]:border-r min-[720px]:border-secondary min-[720px]:shadow-none min-[720px]:ring-0",
            // Visibility only transitions on the way out (hidden once the slide ends). On the way
            // in it must switch at once, or the panel still computes as hidden when focus moves into it.
            isOpen
                ? "visible translate-y-0 transition-[transform] min-[720px]:w-80 min-[720px]:transition-[width]"
                : "invisible translate-y-full transition-[transform,visibility] delay-[0s,300ms] motion-reduce:delay-0 min-[720px]:w-0 min-[720px]:border-r-0 min-[720px]:transition-[width,visibility]",
        )}
    >
        {/* Fixed width so the content doesn't reflow while the column collapses. */}
        <div className="flex flex-col min-[720px]:w-80">
            <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-quaternary min-[720px]:hidden" />
            <div className="relative flex flex-col gap-0.5 px-5 pt-4 pb-5 min-[720px]:pt-5">
                <h2 id="style-panel-title" className="text-lg font-semibold text-primary">
                    Style
                </h2>
                <p className="text-sm text-tertiary">Interval, lines, tints and labels.</p>
                <CloseButton
                    id={STYLE_CLOSE_BUTTON_ID}
                    slot={null}
                    size="md"
                    label="Hide the Style panel"
                    onPress={onClose}
                    className="absolute top-3 right-3"
                />
            </div>
            {children}
        </div>
    </section>
);
