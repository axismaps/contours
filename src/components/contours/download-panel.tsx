"use client";

import { useState } from "react";
import { Download01, InfoCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { ContourMapActions } from "@/hooks/use-contour-map";
import { PanelSection } from "./panel-section";

const Code = ({ children }: { children: string }) => <code className="rounded bg-secondary px-1 py-px font-mono text-xs text-secondary">{children}</code>;

interface DownloadPanelProps {
    actions: ContourMapActions;
    /** Whether contours for the current view are on screen. */
    hasContours: boolean;
    /** Whether a redraw is pending or in progress; the canvas may be blank meanwhile. */
    isDrawing: boolean;
}

export const DownloadPanel = ({ actions, hasContours, isDrawing }: DownloadPanelProps) => {
    const [savingPng, setSavingPng] = useState(false);
    const canExport = hasContours && !isDrawing;

    return (
        <>
            <div className="mx-5 mb-5 flex gap-3 rounded-xl bg-secondary p-4 ring-1 ring-secondary ring-inset">
                <InfoCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                <div className="flex flex-col gap-2 text-sm text-secondary">
                    <p>The hillshade, roads and labels only help you find your area. They are not included in any download.</p>
                    {!canExport && (
                        <p role="status" className="font-medium text-primary">
                            {isDrawing ? "Downloads will be ready once the contours finish drawing." : "Nothing to download yet. Move to a view with contours."}
                        </p>
                    )}
                </div>
            </div>

            <PanelSection
                title="GeoJSON"
                description={
                    <>
                        Contours for GIS or mapping software, as overlapping <Code>MultiPolygon</Code> features with an <Code>elevation</Code> property. Geodata
                        only, no styles.
                    </>
                }
            >
                <Button color="secondary" size="md" iconLeading={Download01} isDisabled={!canExport} onClick={actions.downloadGeoJson}>
                    Download GeoJSON
                </Button>
            </PanelSection>

            <PanelSection title="PNG image" description="A raster image of the map at screen size, with your chosen styles.">
                <Button
                    color="secondary"
                    size="md"
                    iconLeading={Download01}
                    isDisabled={!canExport}
                    isLoading={savingPng}
                    showTextWhileLoading
                    onClick={async () => {
                        setSavingPng(true);
                        try {
                            await actions.downloadPng();
                        } finally {
                            setSavingPng(false);
                        }
                    }}
                >
                    Download PNG
                </Button>
            </PanelSection>

            <PanelSection
                title="SVG"
                description="Contours as vector graphics, one path per elevation. Illuminated contours export as plain polygons; recreate the lighting in your graphics editor."
            >
                <Button color="secondary" size="md" iconLeading={Download01} isDisabled={!canExport} onClick={actions.downloadSvg}>
                    Download SVG
                </Button>
            </PanelSection>
        </>
    );
};
