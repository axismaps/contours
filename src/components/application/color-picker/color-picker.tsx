"use client";

import type React from "react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Dropper, Plus } from "@untitledui/icons";
import type {
    ColorAreaProps as AriaColorAreaProps,
    ColorSliderProps as AriaColorSliderProps,
    ColorSwatchPickerItemProps as AriaColorSwatchPickerItemProps,
    ColorThumbProps as AriaColorThumbProps,
    Color,
    ColorSpace,
} from "react-aria-components";
import {
    ColorArea as AriaColorArea,
    ColorField as AriaColorField,
    ColorSlider as AriaColorSlider,
    ColorSwatch as AriaColorSwatch,
    ColorSwatchPicker as AriaColorSwatchPicker,
    ColorSwatchPickerItem as AriaColorSwatchPickerItem,
    ColorThumb as AriaColorThumb,
    Input as AriaInput,
    SliderTrack as AriaSliderTrack,
    parseColor,
} from "react-aria-components";
import { Button, type ButtonProps } from "@/components/base/buttons/button";
import { Select, type SelectProps } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { Provider, useColorPicker } from "./color-picker-context";
import type { ColorDisplayFormat } from "./color-picker-utils";
import { selectAllOnFocus } from "./color-picker-utils";

const COLOR_FORMAT_ITEMS = [
    { id: "hex", label: "Hex" },
    { id: "rgb", label: "RGB" },
    { id: "css", label: "CSS" },
    { id: "hsl", label: "HSL" },
    { id: "hsb", label: "HSB" },
];

const ColorThumb = ({ className, ...props }: AriaColorThumbProps) => (
    <AriaColorThumb
        className={(state) =>
            cx(
                "size-5 cursor-grab rounded-full border-[3px] border-fg-white shadow-md outline-0 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                state.isDragging && "cursor-grabbing",
                typeof className === "function" ? className(state) : className,
            )
        }
        {...props}
    />
);

const ColorPickerArea = ({ style, className, ...props }: AriaColorAreaProps) => (
    <AriaColorArea
        aria-label="Color picker"
        colorSpace="hsb"
        xChannel="saturation"
        yChannel="brightness"
        {...props}
        style={({ defaultStyle }) => ({ ...defaultStyle, borderRadius: 8, ...style })}
        className={(state) =>
            cx(
                "relative aspect-square w-full shrink-0 rounded-lg ring-[0.5px] ring-alpha-black/10 ring-inset",
                typeof className === "function" ? className(state) : className,
            )
        }
    >
        <ColorThumb />
    </AriaColorArea>
);

const HueSlider = ({ className, ...props }: Omit<AriaColorSliderProps, "channel">) => (
    <AriaColorSlider
        aria-label="Hue"
        {...props}
        channel="hue"
        className={(state) => cx("w-full", typeof className === "function" ? className(state) : className)}
    >
        <AriaSliderTrack
            style={({ defaultStyle }) => ({ ...defaultStyle, borderRadius: 9999 })}
            className="relative h-3 w-full cursor-pointer rounded-full ring-[0.5px] ring-alpha-black/10 ring-inset"
        >
            <ColorThumb style={({ defaultStyle }) => ({ ...defaultStyle, top: "50%" })} />
        </AriaSliderTrack>
    </AriaColorSlider>
);

const AlphaSlider = ({ className, ...props }: Omit<AriaColorSliderProps, "channel">) => (
    <AriaColorSlider
        aria-label="Alpha"
        {...props}
        channel="alpha"
        className={(state) => cx("w-full", typeof className === "function" ? className(state) : className)}
    >
        <AriaSliderTrack
            style={({ defaultStyle }) => ({
                ...defaultStyle,
                borderRadius: 9999,
                background: `${defaultStyle.background}, repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 8px 8px`,
            })}
            className="relative h-3 w-full cursor-pointer rounded-full ring-[0.5px] ring-alpha-black/10 ring-inset"
        >
            <ColorThumb style={({ defaultStyle }) => ({ ...defaultStyle, top: "50%" })} />
        </AriaSliderTrack>
    </AriaColorSlider>
);

const EyeDropperButton = (props: ButtonProps) => {
    const { actions } = useColorPicker();

    const isSupported = typeof window !== "undefined" && "EyeDropper" in window;
    if (!isSupported) return null;

    return (
        <Button
            size="sm"
            color="secondary"
            iconLeading={Dropper}
            onClick={async () => {
                try {
                    // @ts-expect-error EyeDropper API not typed
                    const result = await new EyeDropper().open();
                    actions.setColor(parseColor(result.sRGBHex));
                } catch {
                    /* cancelled */
                }
            }}
            {...props}
        />
    );
};

const ColorFormatSelect = ({ className, ...props }: Omit<SelectProps, "children">) => {
    const { state, actions } = useColorPicker();

    return (
        <Select
            size="sm"
            aria-label="Color format"
            value={state.colorFormat}
            onChange={(value) => actions.setColorFormat(value as ColorDisplayFormat)}
            items={COLOR_FORMAT_ITEMS}
            className={(state) => cx("w-20 shrink-0", typeof className === "function" ? className(state) : className)}
            {...props}
        >
            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>
    );
};

/** Wrapper that mirrors InputBase styling with customizable border radius for input groups. */
export const InputCell = ({
    position = "only",
    className,
    children,
}: {
    /** Where the cell sits in a group of adjacent cells. Rounds the matching corners and pulls the cell onto its neighbour's border. */
    position?: "first" | "middle" | "last" | "only";
    /** Additional class name for the cell wrapper. */
    className?: string;
    /** The input (or other control) rendered inside the cell. */
    children: React.ReactNode;
}) => {
    const radius = {
        only: "rounded-lg",
        first: "rounded-l-lg",
        middle: "rounded-none",
        last: "rounded-r-lg",
    }[position];

    return (
        <div
            className={cx(
                "relative flex place-content-center place-items-center bg-primary ring-1 ring-primary transition-shadow duration-100 ease-linear ring-inset focus-within:z-10 focus-within:ring-2 focus-within:ring-brand",
                radius,
                position !== "only" && position !== "first" && "-ml-px",
                className,
            )}
        >
            {children}
        </div>
    );
};

interface SwatchItemsProps extends AriaColorSwatchPickerItemProps {
    /** Diameter of the swatch dot — 16px for "sm", 20px for "md". */
    size?: "sm" | "md";
}

export const SwatchItem = ({ color, size = "md", ...props }: SwatchItemsProps) => (
    <AriaColorSwatchPickerItem
        {...props}
        color={color}
        style={{ "--swatch-color": color } as React.CSSProperties}
        className={(state) =>
            cx(
                "cursor-pointer rounded-full",
                size === "sm" ? "size-4" : "size-5",
                state.isFocusVisible
                    ? "outline-2 outline-offset-2 outline-focus-ring"
                    : state.isSelected
                      ? "outline-2 outline-offset-2 outline-(--swatch-color)"
                      : "outline-0",
                typeof props.className === "function" ? props.className(state) : props.className,
            )
        }
    >
        <AriaColorSwatch className="size-full rounded-full ring-1 ring-alpha-black/10 ring-inset" style={({ defaultStyle }) => defaultStyle} />
    </AriaColorSwatchPickerItem>
);

const channelInputClass = "w-full min-w-0 bg-transparent px-2.5 py-2 text-sm text-primary outline-hidden";

const CHANNEL_CONFIG = {
    rgb: { colorSpace: "rgb" as ColorSpace, channels: ["red", "green", "blue"] as const },
    hsl: { colorSpace: "hsl" as ColorSpace, channels: ["hue", "saturation", "lightness"] as const },
    hsb: { colorSpace: "hsb" as ColorSpace, channels: ["hue", "saturation", "brightness"] as const },
};

const ColorValueInput = () => {
    const { state } = useColorPicker();
    if (state.colorFormat === "hex") return <HexInput />;
    if (state.colorFormat === "css") return <CssInput />;
    return <ChannelInput format={state.colorFormat} />;
};

const HexInput = () => {
    const { state, actions } = useColorPicker();
    return (
        <div className="flex flex-1 shadow-xs">
            <InputCell position="first" className="flex-1">
                <AriaColorField
                    aria-label="Hex color"
                    value={state.color}
                    onChange={(c) => {
                        if (c) actions.setColor(c);
                    }}
                    className="flex flex-1 items-center gap-2 px-2.5 py-2"
                >
                    <AriaColorSwatch
                        className="size-4 shrink-0 rounded-full ring-1 ring-alpha-black/10 ring-inset"
                        style={({ defaultStyle }) => defaultStyle}
                    />
                    <AriaInput onFocus={selectAllOnFocus} className="w-full min-w-0 bg-transparent text-sm text-primary outline-hidden" />
                </AriaColorField>
            </InputCell>
            <InputCell position="last" className="w-14 shrink-0">
                <AriaColorField
                    aria-label="Alpha"
                    channel="alpha"
                    value={state.color}
                    onChange={(c) => {
                        if (c) actions.setColor(c);
                    }}
                    className="flex w-full items-center"
                >
                    <AriaInput onFocus={selectAllOnFocus} className="w-full min-w-0 bg-transparent px-2.5 py-2 text-sm text-primary outline-hidden" />
                </AriaColorField>
            </InputCell>
        </div>
    );
};

const CssInput = () => {
    const { state, actions } = useColorPicker();
    const [draft, setDraft] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const toRgba = (c: Color) => {
        const rgb = c.toFormat("rgb");
        return `rgba(${Math.round(rgb.getChannelValue("red"))}, ${Math.round(rgb.getChannelValue("green"))}, ${Math.round(rgb.getChannelValue("blue"))}, ${Math.round(rgb.getChannelValue("alpha") * 100) / 100})`;
    };

    return (
        <InputCell className="flex-1 shadow-xs">
            <input
                ref={inputRef}
                value={draft ?? toRgba(state.color)}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={(e) => {
                    const val = toRgba(state.color);
                    setDraft(val);
                    requestAnimationFrame(() => {
                        const s = val.indexOf("(") + 1;
                        const end = val.indexOf(")");
                        if (s > 0 && end > s) e.target.setSelectionRange(s, end);
                    });
                }}
                onBlur={() => {
                    if (draft !== null) {
                        try {
                            actions.setColor(parseColor(draft));
                        } catch {
                            /* */
                        }
                        setDraft(null);
                    }
                }}
                className="w-full min-w-0 bg-transparent px-3 py-2 text-sm text-primary outline-hidden"
            />
        </InputCell>
    );
};

const ChannelInput = ({ format }: { format: ColorDisplayFormat }) => {
    const { state, actions } = useColorPicker();
    const config = CHANNEL_CONFIG[format as keyof typeof CHANNEL_CONFIG];
    if (!config) return null;
    const converted = state.color.toFormat(config.colorSpace);

    return (
        <div className="flex flex-1 shadow-xs">
            {config.channels.map((ch, i) => (
                <InputCell key={ch} position={i === 0 ? "first" : "middle"} className="flex-1">
                    <AriaColorField
                        aria-label={ch.charAt(0).toUpperCase() + ch.slice(1)}
                        channel={ch}
                        colorSpace={config.colorSpace}
                        value={converted}
                        onChange={(c) => {
                            if (c) actions.setColor(c);
                        }}
                        className="flex w-full"
                    >
                        <AriaInput onFocus={selectAllOnFocus} className={channelInputClass} />
                    </AriaColorField>
                </InputCell>
            ))}
            <InputCell position="last" className="w-14 shrink-0">
                <AriaColorField
                    aria-label="Alpha"
                    channel="alpha"
                    value={converted}
                    onChange={(c) => {
                        if (c) actions.setColor(c);
                    }}
                    className="flex w-full"
                >
                    <AriaInput onFocus={selectAllOnFocus} className={channelInputClass} />
                </AriaColorField>
            </InputCell>
        </div>
    );
};

export interface SavedColorsProps {
    /** Heading text above the swatch list. */
    label?: string;
    /** Array of CSS color strings or gradient strings to display as swatches. */
    colors: string[];
    /** Called when the "Add" button is clicked. Omit to hide the button. */
    onAdd?: () => void;
    /** Called when a swatch is selected, with the color/gradient string. */
    onSelect?: (color: string) => void;
}

const SavedColors = ({ label = "Saved", colors, onAdd, onSelect }: SavedColorsProps) => {
    // Check if colors are solid (parseable) or gradients
    const firstColor = colors[0];
    const isSolid =
        firstColor !== undefined &&
        (() => {
            try {
                parseColor(firstColor);
                return true;
            } catch {
                return false;
            }
        })();

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <p className="flex-1 text-sm font-semibold text-secondary">{label}</p>
                {onAdd && (
                    <Button size="xs" color="link-gray" iconLeading={Plus} onClick={onAdd}>
                        Add
                    </Button>
                )}
            </div>
            {isSolid ? (
                <AriaColorSwatchPicker aria-label={label} className="flex flex-wrap gap-2" onChange={(color) => onSelect?.(color.toString("hex"))}>
                    {colors.map((c) => (
                        <SwatchItem key={c} color={c} />
                    ))}
                </AriaColorSwatchPicker>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {colors.map((c, i) => (
                        <button
                            key={`${c}-${i}`}
                            type="button"
                            onClick={() => onSelect?.(c)}
                            className="size-5 cursor-pointer rounded-full ring-1 ring-alpha-black/10 transition duration-100 ease-linear ring-inset hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                            style={{ background: c }}
                            aria-label="Select gradient"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/** All-in-one solid color picker layout */
const ColorPickerSolid = () => (
    <div className="flex flex-col gap-4">
        <ColorPickerArea />
        <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
                <EyeDropperButton />
                <div className="flex flex-1 flex-col gap-3">
                    <HueSlider />
                    <AlphaSlider />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <ColorFormatSelect />
                <ColorValueInput />
            </div>
        </div>
    </div>
);

/** Card container for the color picker. */
const ColorPickerDialog = ({
    className,
    children,
}: {
    /** Additional class name for the card. Useful for overriding the default fixed width. */
    className?: string;
    /** The picker sections to render inside the card. */
    children?: ReactNode;
}) => <div className={cx("relative flex w-80 flex-col overflow-clip rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt", className)}>{children}</div>;

/** Compound export */
const ColorPicker = Object.assign(ColorPickerSolid, {
    Dialog: ColorPickerDialog,
    Provider,
    Area: ColorPickerArea,
    HueSlider,
    AlphaSlider,
    EyeDropper: EyeDropperButton,
    ColorFormatSelect,
    ColorValueInput,
    SavedColors,
    SwatchItem,
});

export { ColorPicker };
