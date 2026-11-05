"use client";

import { type FC, useState } from "react";
import { Download01, FileCode02, Globe02, Image01 } from "@untitledui/icons";
import { Menu as AriaMenu, MenuItem as AriaMenuItem, MenuTrigger as AriaMenuTrigger, Text as AriaText } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Popover } from "@/components/base/select/popover";
import type { ContourMapActions } from "@/hooks/use-contour-map";
import { cx } from "@/utils/cx";

interface DownloadMenuProps {
    actions: ContourMapActions;
    /** Whether contours for the current view are on screen. */
    hasContours: boolean;
    /** Whether a redraw is pending or in progress; the canvas may be blank meanwhile. */
    isDrawing: boolean;
}

type Format = "geojson" | "svg" | "png";

const FORMATS: { id: Format; label: string; description: string; icon: FC<{ className?: string }> }[] = [
    {
        id: "geojson",
        label: "GeoJSON",
        description: "Overlapping MultiPolygon features with an elevation property, for GIS or mapping software. No styles.",
        icon: Globe02,
    },
    {
        id: "svg",
        label: "SVG",
        description: "One path per elevation with your styles. Illuminated contours export as plain polygons.",
        icon: FileCode02,
    },
    {
        id: "png",
        label: "PNG image",
        description: "Your styles at twice the on-screen size, or your display's pixel density if higher. Transparent where nothing is filled.",
        icon: Image01,
    },
];

/** The header's Download button: a menu of the three export formats, disabled while there is nothing to export. */
export const DownloadMenu = ({ actions, hasContours, isDrawing }: DownloadMenuProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const canExport = hasContours && !isDrawing;

    const download = async (format: Format) => {
        setIsSaving(true);
        try {
            if (format === "geojson") actions.downloadGeoJson();
            else if (format === "svg") actions.downloadSvg();
            else await actions.downloadPng();
        } catch (error) {
            console.error("Download failed", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AriaMenuTrigger>
            <Button color="primary" size="sm" iconLeading={Download01} isLoading={isSaving} showTextWhileLoading aria-label="Download" className="shrink-0">
                <span className="hidden sm:inline">Download</span>
            </Button>
            <Popover size="lg" placement="bottom end" className="max-h-none! w-80 p-2">
                {!canExport && (
                    <p role="status" className="px-3 pt-2 pb-3 text-sm font-medium text-primary">
                        {isDrawing ? "Downloads will be ready once the contours finish drawing." : "Nothing to download yet. Move to a view with contours."}
                    </p>
                )}
                <AriaMenu
                    aria-label="Download formats"
                    className="outline-hidden"
                    disabledKeys={canExport ? [] : FORMATS.map((f) => f.id)}
                    onAction={(key) => void download(key as Format)}
                >
                    {FORMATS.map(({ id, label, description, icon: Icon }) => (
                        <AriaMenuItem
                            key={id}
                            id={id}
                            textValue={label}
                            className={({ isFocused, isDisabled, isFocusVisible }) =>
                                cx(
                                    "flex cursor-pointer items-start gap-3 rounded-lg p-3 outline-hidden select-none",
                                    isFocused && "bg-primary_hover",
                                    isDisabled && "cursor-not-allowed opacity-50",
                                    isFocusVisible && "ring-2 ring-focus-ring ring-inset",
                                )
                            }
                        >
                            <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                            <div className="flex min-w-0 flex-col">
                                <AriaText slot="label" className="text-sm font-medium text-primary">
                                    {label}
                                </AriaText>
                                <AriaText slot="description" className="text-sm text-tertiary">
                                    {description}
                                </AriaText>
                            </div>
                        </AriaMenuItem>
                    ))}
                </AriaMenu>
                <p className="mt-2 border-t border-secondary px-3 pt-3 pb-1.5 text-xs text-tertiary">The hillshade, roads and labels are never included.</p>
            </Popover>
        </AriaMenuTrigger>
    );
};
