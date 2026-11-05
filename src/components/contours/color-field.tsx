"use client";

import { useState } from "react";
import {
    Button as AriaButton,
    ColorSwatch as AriaColorSwatch,
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Popover as AriaPopover,
} from "react-aria-components";
import { ColorPicker } from "@/components/application/color-picker/color-picker";
import { InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { normalizeHex } from "@/lib/contours/color";
import { cx } from "@/utils/cx";

interface ColorFieldProps {
    label: string;
    /** `#rrggbb` */
    value: string;
    onChange: (hex: string) => void;
    className?: string;
}

/**
 * A color setting as an input group: a swatch that opens the color picker,
 * then the hex value. The two stay in sync.
 */
export const ColorField = ({ label, value, onChange, className }: ColorFieldProps) => {
    const [draft, setDraft] = useState(value);
    const [lastValue, setLastValue] = useState(value);

    // Adopt a new value from outside (the picker, or a reset) unless the draft already spells it.
    if (value !== lastValue) {
        setLastValue(value);
        if (normalizeHex(draft) !== value) setDraft(value);
    }

    const swatch = (
        <AriaDialogTrigger>
            <AriaButton
                aria-label={`${label}: open color picker`}
                className="-mr-px flex h-full cursor-pointer items-center rounded-l-lg bg-primary px-2.5 shadow-xs ring-1 ring-primary outline-focus-ring transition duration-100 ease-linear ring-inset hover:bg-primary_hover focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <AriaColorSwatch color={value} className="size-5 rounded-md ring-1 ring-alpha-black/10 ring-inset" style={({ defaultStyle }) => defaultStyle} />
            </AriaButton>
            <AriaPopover
                placement="bottom start"
                offset={6}
                className={({ isEntering, isExiting }) =>
                    cx(
                        "outline-hidden",
                        isEntering && "duration-150 ease-out animate-in fade-in zoom-in-95",
                        isExiting && "duration-100 ease-in animate-out fade-out zoom-out-95",
                    )
                }
            >
                <AriaDialog aria-label={`${label} picker`} className="outline-hidden">
                    <ColorPicker.Dialog className="w-72 p-4">
                        <ColorPicker.Provider value={value} onChange={(color) => onChange(color.toString("hex").toLowerCase())}>
                            <div className="flex flex-col gap-4">
                                <ColorPicker.Area />
                                <ColorPicker.HueSlider />
                                <div className="flex items-center gap-3">
                                    <ColorPicker.EyeDropper />
                                    <ColorPicker.ColorValueInput />
                                </div>
                            </div>
                        </ColorPicker.Provider>
                    </ColorPicker.Dialog>
                </AriaDialog>
            </AriaPopover>
        </AriaDialogTrigger>
    );

    return (
        <InputGroup
            size="sm"
            label={label}
            className={className}
            // Tighter than the default so a seven-character hex fits in the half-width fields.
            inputClassName="px-2 lowercase tabular-nums"
            leadingAddon={swatch}
            value={draft}
            onChange={(text) => {
                setDraft(text);
                const hex = normalizeHex(text);
                if (hex && hex !== value) onChange(hex);
            }}
            onBlur={() => {
                if (!normalizeHex(draft)) setDraft(value);
            }}
        >
            <InputBase />
        </InputGroup>
    );
};
