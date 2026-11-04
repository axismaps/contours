"use client";

import type { FC } from "react";
import { Brush01, Download01 } from "@untitledui/icons";
import { ToggleButton as AriaToggleButton } from "react-aria-components";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";

export type PanelId = "style" | "download";

interface ToolRailProps {
    active: PanelId | null;
    onToggle: (panel: PanelId) => void;
}

/** Same look as the slim sidebar's `NavButton`, as a real toggle button. */
const RailButton = ({ id, label, icon: Icon, active, onToggle }: { id: PanelId; label: string; icon: FC<{ className?: string }> } & ToolRailProps) => {
    const isSelected = active === id;
    return (
        <Tooltip title={label} placement="right">
            <AriaToggleButton
                aria-label={label}
                aria-controls={`${id}-panel`}
                isSelected={isSelected}
                onChange={() => onToggle(id)}
                className={cx(
                    "group/item relative flex size-10 cursor-pointer items-center justify-center rounded-md bg-primary outline-focus-ring transition duration-100 ease-linear select-none hover:bg-primary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
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
            </AriaToggleButton>
        </Tooltip>
    );
};

/** The slim icon rail on the left with the panel toggles. */
export const ToolRail = (props: ToolRailProps) => (
    <nav aria-label="Tools" className="z-20 flex w-16 shrink-0 flex-col items-center gap-1 border-r border-secondary bg-primary pt-4">
        <RailButton id="style" label="Style" icon={Brush01} {...props} />
        <RailButton id="download" label="Download" icon={Download01} {...props} />
    </nav>
);
