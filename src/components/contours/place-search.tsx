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

/** What the last search produced, so the popover can say "nothing" or "broken" instead of staying shut. */
type SearchStatus = "idle" | "found" | "empty" | "error";

/** Debounced Mapbox place search. Enter picks the first result when none is highlighted. */
export const PlaceSearch = ({ onSelect }: PlaceSearchProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [status, setStatus] = useState<SearchStatus>("idle");
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    const updateQuery = (text: string) => {
        setQuery(text);
        if (text.trim().length < 2) {
            setResults([]);
            setStatus("idle");
            setIsOpen(false);
        }
    };

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2 || !MAPBOX_TOKEN) return;
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const found = await geocodePlace(trimmed, MAPBOX_TOKEN, controller.signal);
                if (controller.signal.aborted) return;
                setResults(found);
                setStatus(found.length > 0 ? "found" : "empty");
                setIsOpen(true);
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error(error);
                    setResults([]);
                    setStatus("error");
                    setIsOpen(true);
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
        setStatus("idle");
        setIsOpen(false);
        (document.activeElement as HTMLElement | null)?.blur();
    };

    return (
        <AriaComboBox
            aria-label="Search for a place"
            items={results}
            inputValue={query}
            onInputChange={updateQuery}
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
                    placeholder={MAPBOX_TOKEN ? "Search for a place" : "Search unavailable"}
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

            <Popover size="md" triggerRef={triggerRef} isOpen={isOpen && status !== "idle"} onOpenChange={setIsOpen} isNonModal>
                <AriaListBox
                    className="size-full outline-hidden"
                    renderEmptyState={() => (
                        <div className="px-3 py-2 text-sm text-tertiary">{status === "error" ? "Search is unavailable right now." : "No places found."}</div>
                    )}
                >
                    {(place: PlaceResult) => <SelectItem id={place.id} label={place.name} />}
                </AriaListBox>
            </Popover>
        </AriaComboBox>
    );
};
