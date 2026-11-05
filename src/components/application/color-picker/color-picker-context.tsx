"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { Color } from "react-aria-components";
import { ColorPicker as AriaColorPicker, parseColor } from "react-aria-components";
import type { ColorDisplayFormat } from "./color-picker-utils";

/** Color picker state. */
export interface ColorPickerState {
    /** Currently selected color. */
    color: Color;
    /** Active color format for the value input. */
    colorFormat: ColorDisplayFormat;
}

/** Actions for the color picker. */
export interface ColorPickerActions {
    /** Set the active color. */
    setColor: (color: Color) => void;
    /** Switch the color format (hex, rgb, css, hsl, hsb). */
    setColorFormat: (format: ColorDisplayFormat) => void;
}

export interface ColorPickerContextValue {
    state: ColorPickerState;
    actions: ColorPickerActions;
}

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);
const ColorPickerProvider = ColorPickerContext.Provider;

export const useColorPicker = (): ColorPickerContextValue => {
    const ctx = useContext(ColorPickerContext);
    if (!ctx) throw new Error("useColorPicker must be used within <ColorPicker.Provider>");
    return ctx;
};

/** Non-throwing version — returns null when outside a Provider. */
export const useColorPickerSafe = (): ColorPickerContextValue | null => useContext(ColorPickerContext);

const toHsb = (value: string | Color): Color => (typeof value === "string" ? parseColor(value) : value).toFormat("hsb");

/** Props for the color state provider. */
export interface ProviderProps {
    /** Initial color value as a CSS string or React Aria Color object. */
    defaultValue?: string | Color;
    /** Controlled color value as a CSS string or React Aria Color object. */
    value?: string | Color;
    /** Initial color format for the value input. */
    defaultColorFormat?: ColorDisplayFormat;
    /** Called when the selected color changes. */
    onChange?: (color: Color) => void;
    /** The color picker parts that read and update the shared color state. */
    children: ReactNode;
}

/** Color state provider. Wraps children in both context and AriaColorPicker. */
export const Provider = ({ defaultValue = "#7F56D9", value, defaultColorFormat = "hex", onChange, children }: ProviderProps) => {
    const [internalColor, setInternalColor] = useState<Color>(() => toHsb(value ?? defaultValue));
    const [colorFormat, setColorFormat] = useState<ColorDisplayFormat>(defaultColorFormat);

    // A controlled value always wins; it is parsed once per value.
    const isControlled = value !== undefined;
    const controlledColor = useMemo(() => (value === undefined ? undefined : toHsb(value)), [value]);
    const color = controlledColor ?? internalColor;

    // onChange fires here, when the color changes, instead of from an effect watching state.
    const actions = useMemo<ColorPickerActions>(
        () => ({
            setColor: (next) => {
                const hsb = next.toFormat("hsb");
                if (hsb.toString("hsba") === color.toString("hsba")) return;
                if (!isControlled) setInternalColor(hsb);
                onChange?.(hsb);
            },
            setColorFormat,
        }),
        [color, isControlled, onChange],
    );
    const state = useMemo<ColorPickerState>(() => ({ color, colorFormat }), [color, colorFormat]);

    return (
        <ColorPickerProvider value={{ state, actions }}>
            <AriaColorPicker value={state.color} onChange={(c) => actions.setColor(c)}>
                {children}
            </AriaColorPicker>
        </ColorPickerProvider>
    );
};
