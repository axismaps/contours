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
 * A panel that slides out beside the rail, styled like the slideout menu.
 * On phones it takes the rest of the width. Closed, it is off-screen and inert.
 */
export const SidePanel = ({ id, title, description, isOpen, onClose, children }: SidePanelProps) => (
    <section
        id={`${id}-panel`}
        aria-labelledby={`${id}-panel-title`}
        inert={!isOpen}
        className={cx(
            "absolute inset-y-0 left-0 z-10 flex w-80 max-w-[calc(100vw-4rem)] flex-col overflow-y-auto overscroll-contain bg-primary shadow-xl ring-1 ring-secondary_alt",
            "transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none",
            isOpen ? "visible translate-x-0 delay-0" : "invisible -translate-x-full delay-[0s,300ms] motion-reduce:delay-0",
        )}
    >
        <div className="relative flex flex-col gap-0.5 px-5 pt-5 pb-5">
            <h2 id={`${id}-panel-title`} className="text-lg font-semibold text-primary">
                {title}
            </h2>
            <p className="text-sm text-tertiary">{description}</p>
            <CloseButton slot={null} size="md" label="Close panel" onPress={onClose} className="absolute top-3 right-3" />
        </div>
        {children}
    </section>
);
