"use client";

import type { FC } from "react";
import { Brush01, Download01 } from "@untitledui/icons";
import { ToggleButton as AriaToggleButton } from "react-aria-components";
import { cx } from "@/utils/cx";

export type PanelId = "style" | "download";

/** The id of the rail button that opens a panel, so closing the panel can hand focus back to it. */
export const railButtonId = (id: PanelId) => `${id}-rail-button`;

interface ToolRailProps {
    active: PanelId | null;
    onToggle: (panel: PanelId) => void;
}

/** An icon with a caption, as a real toggle button that announces the panel it controls. */
const RailButton = ({ id, label, icon: Icon, active, onToggle }: { id: PanelId; label: string; icon: FC<{ className?: string }> } & ToolRailProps) => {
    const isSelected = active === id;
    return (
        <AriaToggleButton
            id={railButtonId(id)}
            aria-controls={`${id}-panel`}
            aria-expanded={isSelected}
            isSelected={isSelected}
            onChange={() => onToggle(id)}
            className={cx(
                "group/item relative flex w-14 cursor-pointer flex-col items-center gap-1 rounded-md bg-primary py-2 outline-focus-ring transition duration-100 ease-linear select-none hover:bg-primary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
                isSelected && "bg-secondary hover:bg-secondary_hover",
            )}
        >
            <Icon
                aria-hidden="true"
                className={cx(
                    "size-5 shrink-0 text-fg-quaternary transition-inherit-all group-hover/item:text-fg-quaternary_hover",
                    isSelected && "text-fg-brand-primary",
                )}
            />
            <span className={cx("text-[11px] leading-none font-medium text-tertiary transition-inherit-all", isSelected && "text-brand-secondary")}>
                {label}
            </span>
        </AriaToggleButton>
    );
};

/** The slim rail on the left with the panel toggles. */
export const ToolRail = (props: ToolRailProps) => (
    <nav aria-label="Tools" className="z-20 flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-primary pt-3">
        <RailButton id="style" label="Style" icon={Brush01} {...props} />
        <RailButton id="download" label="Download" icon={Download01} {...props} />
    </nav>
);
