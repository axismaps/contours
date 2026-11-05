"use client";

import { Button } from "@/components/base/buttons/button";
import type { ContourMapActions } from "@/hooks/use-contour-map";
import { AXIS_MAPS_LOGO_URL, AXIS_MAPS_URL } from "@/lib/contours/constants";
import type { PlaceResult } from "@/lib/contours/geocode";
import { DownloadMenu } from "./download-menu";
import { ContoursLogo } from "./logo";
import { PlaceSearch } from "./place-search";

interface AppHeaderProps {
    onSelectPlace: (place: PlaceResult) => void;
    actions: ContourMapActions;
    hasContours: boolean;
    isDrawing: boolean;
}

export const AppHeader = ({ onSelectPlace, actions, hasContours, isDrawing }: AppHeaderProps) => (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-secondary bg-primary px-4 md:gap-6 md:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
            <ContoursLogo />
            <h1 className="text-md font-semibold text-primary">Contours</h1>
            {/* The credit sits with the wordmark; on phones it moves to the Style panel's footer. */}
            <Button
                color="link-gray"
                size="sm"
                href={AXIS_MAPS_URL}
                target="_blank"
                rel="noopener"
                // At least a 40px target where only the logo shows.
                className="hidden min-h-10 min-w-10 shrink-0 justify-center sm:flex"
                iconLeading={
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={AXIS_MAPS_LOGO_URL} alt="" width={20} height={20} className="size-5 shrink-0 rounded" />
                }
            >
                <span className="hidden md:inline">by Axis Maps</span>
                <span className="sr-only md:hidden">by Axis Maps</span>
            </Button>
        </div>

        <div className="mx-auto w-full max-w-md min-w-0">
            <PlaceSearch onSelect={onSelectPlace} />
        </div>

        <DownloadMenu actions={actions} hasContours={hasContours} isDrawing={isDrawing} />
    </header>
);
