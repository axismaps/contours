"use client";

import { Button } from "@/components/base/buttons/button";
import { AXIS_MAPS_LOGO_URL, AXIS_MAPS_URL } from "@/lib/contours/constants";
import type { PlaceResult } from "@/lib/contours/geocode";
import { ContoursLogo } from "./logo";
import { PlaceSearch } from "./place-search";

export const AppHeader = ({ onSelectPlace }: { onSelectPlace: (place: PlaceResult) => void }) => (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-secondary bg-primary px-4 md:gap-6 md:px-6">
        <div className="flex items-center gap-2.5">
            <ContoursLogo />
            <h1 className="text-md font-semibold text-primary">Contours</h1>
        </div>

        <div className="mx-auto w-full max-w-md min-w-0">
            <PlaceSearch onSelect={onSelectPlace} />
        </div>

        <Button
            color="link-gray"
            size="sm"
            href={AXIS_MAPS_URL}
            target="_blank"
            rel="noopener"
            // At least a 40px target where the text is hidden and only the logo shows.
            className="min-h-10 min-w-10 shrink-0 justify-center"
            iconLeading={
                // eslint-disable-next-line @next/next/no-img-element
                <img src={AXIS_MAPS_LOGO_URL} alt="" width={20} height={20} className="size-5 shrink-0 rounded" />
            }
        >
            <span className="hidden md:inline">by Axis Maps</span>
            <span className="sr-only md:hidden">by Axis Maps</span>
        </Button>
    </header>
);
