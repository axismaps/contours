"use client";

import { useEffect, useRef, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import { ComboBox as AriaComboBox, Group as AriaGroup, Input as AriaInput, ListBox as AriaListBox } from "react-aria-components";
import { Popover } from "@/components/base/select/popover";
import { SelectItem } from "@/components/base/select/select-item";
import { MAPBOX_TOKEN, SEARCH_DELAY_MS } from "@/lib/contours/constants";
import { type PlaceResult, geocodePlace } from "@/lib/contours/geocode";
import { cx } from "@/utils/cx";

interface PlaceSearchProps {
    onSelect: (place: PlaceResult) => void;
}

/** Debounced Mapbox place search. Enter picks the first result when none is highlighted. */
export const PlaceSearch = ({ onSelect }: PlaceSearchProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2 || !MAPBOX_TOKEN) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const found = await geocodePlace(trimmed, MAPBOX_TOKEN, controller.signal);
                if (controller.signal.aborted) return;
                setResults(found);
                setIsOpen(found.length > 0);
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error(error);
                    setResults([]);
                    setIsOpen(false);
                }
            }
        }, SEARCH_DELAY_MS);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    const choose = (place: PlaceResult | undefined) => {
        if (!place) return;
        onSelect(place);
        setQuery("");
        setResults([]);
        setIsOpen(false);
        (document.activeElement as HTMLElement | null)?.blur();
    };

    return (
        <AriaComboBox
            aria-label="Search for a place"
            items={results}
            inputValue={query}
            onInputChange={setQuery}
            selectedKey={null}
            onSelectionChange={(key) => choose(results.find((r) => r.id === key))}
            allowsEmptyCollection
            allowsCustomValue
            menuTrigger="input"
            isDisabled={!MAPBOX_TOKEN}
            className="w-full"
        >
            <AriaGroup
                ref={triggerRef}
                className={({ isFocusWithin, isDisabled }) =>
                    cx(
                        "relative flex w-full items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary transition-shadow duration-100 ease-linear ring-inset",
                        isFocusWithin && "ring-2 ring-brand",
                        isDisabled && "cursor-not-allowed opacity-50",
                    )
                }
            >
                <SearchLg aria-hidden="true" className="pointer-events-none absolute left-3 size-5 text-fg-quaternary" />
                <AriaInput
                    type="search"
                    placeholder={MAPBOX_TOKEN ? "Search for a place" : "Search needs a Mapbox token"}
                    autoComplete="off"
                    spellCheck={false}
                    onKeyDown={(event) => {
                        // Enter with nothing highlighted takes the first result.
                        if (event.key === "Enter" && !event.currentTarget.getAttribute("aria-activedescendant")) {
                            event.preventDefault();
                            choose(results[0]);
                        }
                    }}
                    className="w-full bg-transparent py-2 pr-3 pl-10 text-md text-primary outline-hidden placeholder:text-placeholder disabled:cursor-not-allowed"
                />
            </AriaGroup>

            <Popover size="md" triggerRef={triggerRef} isOpen={isOpen && results.length > 0} onOpenChange={setIsOpen} isNonModal>
                <AriaListBox className="size-full outline-hidden">{(place: PlaceResult) => <SelectItem id={place.id} label={place.name} />}</AriaListBox>
            </Popover>
        </AriaComboBox>
    );
};
