"use client";

import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { AXIS_MAPS_URL, BLOG_POST_URL } from "@/lib/contours/constants";
import { convertInterval } from "@/lib/contours/interval";
import type { BackgroundType, BathymetryType, ContourSettings, IndexEvery, MapType, Unit } from "@/lib/contours/types";
import { ColorField } from "./color-field";
import { NumberField } from "./number-field";
import { PanelSection } from "./panel-section";

interface StylePanelProps {
    settings: ContourSettings;
    onChange: (patch: Partial<ContourSettings>) => void;
    /** Whether the current view has elevations below sea level; bathymetry options only show then. */
    hasBathymetry: boolean;
}

const INDEX_OPTIONS: IndexEvery[] = [0, 2, 5, 10];

export const StylePanel = ({ settings, onChange, hasBathymetry }: StylePanelProps) => {
    const illuminated = settings.mapType === "illuminated";
    const indexItems = INDEX_OPTIONS.map((n) => ({ id: String(n), label: n === 0 ? "None" : `${n * settings.interval} ${settings.unit}` }));

    return (
        <>
            <PanelSection title="Map type">
                <RadioGroup aria-label="Map type" value={settings.mapType} onChange={(mapType) => onChange({ mapType: mapType as MapType })}>
                    <RadioButton value="lines" label="Contour lines" hint="A line at every interval." />
                    <RadioButton value="illuminated" label="Illuminated contours" hint="Shaded bands that read as raised terrain." />
                </RadioGroup>
            </PanelSection>

            <PanelSection title="Contour interval">
                <div className="flex items-end gap-3">
                    <NumberField
                        label="Every"
                        value={settings.interval}
                        onChange={(interval) => onChange({ interval })}
                        min={Number.MIN_VALUE}
                        commitOn="blur"
                        className="flex-1"
                    />
                    <ButtonGroup
                        size="sm"
                        aria-label="Units"
                        selectedKeys={[settings.unit]}
                        disallowEmptySelection
                        onSelectionChange={(keys) => {
                            const unit = [...keys][0];
                            if (unit !== "m" && unit !== "ft") return;
                            // Keep roughly the same line density rather than the same number.
                            onChange({ unit: unit as Unit, interval: convertInterval(settings.interval, settings.unit, unit as Unit) });
                        }}
                    >
                        <ButtonGroupItem id="m">m</ButtonGroupItem>
                        <ButtonGroupItem id="ft">ft</ButtonGroupItem>
                    </ButtonGroup>
                </div>
                <Select
                    size="sm"
                    label="Index line every"
                    hint={illuminated ? "Index lines only apply to contour lines." : undefined}
                    isDisabled={illuminated}
                    items={indexItems}
                    selectedKey={String(settings.indexEvery)}
                    onSelectionChange={(key) => {
                        if (key !== null) onChange({ indexEvery: Number(key) as IndexEvery });
                    }}
                >
                    {(item) => <Select.Item id={item.id} label={item.label} />}
                </Select>
            </PanelSection>

            <PanelSection title="Contour style">
                {illuminated ? (
                    <>
                        <ColorField label="Highlight color" value={settings.highlightColor} onChange={(highlightColor) => onChange({ highlightColor })} />
                        <ColorField label="Shadow color" value={settings.shadowColor} onChange={(shadowColor) => onChange({ shadowColor })} />
                        <NumberField label="Shadow width" suffix="px" value={settings.shadowWidth} onChange={(shadowWidth) => onChange({ shadowWidth })} />
                    </>
                ) : (
                    <>
                        <ColorField label="Contour color" value={settings.lineColor} onChange={(lineColor) => onChange({ lineColor })} />
                        <div className="grid grid-cols-2 gap-3">
                            <NumberField label="Line weight" suffix="px" value={settings.lineWidth} onChange={(lineWidth) => onChange({ lineWidth })} />
                            <NumberField
                                label="Index weight"
                                suffix="px"
                                value={settings.indexLineWidth}
                                onChange={(indexLineWidth) => onChange({ indexLineWidth })}
                                isDisabled={settings.indexEvery === 0}
                            />
                        </div>
                    </>
                )}
            </PanelSection>

            <PanelSection title="Background">
                <RadioGroup
                    aria-label="Background"
                    value={settings.background}
                    onChange={(background) => onChange({ background: background as BackgroundType })}
                >
                    <RadioButton
                        value="none"
                        label={illuminated ? "White" : "None"}
                        hint={illuminated ? "Illuminated bands are always filled. Pick Solid color to change it." : undefined}
                    />
                    <RadioButton value="solid" label="Solid color" />
                    {settings.background === "solid" && (
                        <ColorField className="pl-6" label="Fill color" value={settings.solidColor} onChange={(solidColor) => onChange({ solidColor })} />
                    )}
                    <RadioButton value="hypso" label="Hypsometric tints" hint="A color ramp from low to high ground." />
                    {settings.background === "hypso" && (
                        <div className="grid grid-cols-2 gap-3 pl-6">
                            <ColorField label="Low" value={settings.hypsoLowColor} onChange={(hypsoLowColor) => onChange({ hypsoLowColor })} />
                            <ColorField label="High" value={settings.hypsoHighColor} onChange={(hypsoHighColor) => onChange({ hypsoHighColor })} />
                        </div>
                    )}
                </RadioGroup>
            </PanelSection>

            {hasBathymetry && (
                <PanelSection title="Bathymetry" description="This view dips below sea level.">
                    <RadioGroup
                        aria-label="Bathymetry"
                        value={settings.bathymetry}
                        onChange={(bathymetry) => onChange({ bathymetry: bathymetry as BathymetryType })}
                    >
                        <RadioButton value="none" label="None" />
                        <RadioButton value="solid" label="Solid color" />
                        {settings.bathymetry === "solid" && (
                            <ColorField className="pl-6" label="Water color" value={settings.oceanColor} onChange={(oceanColor) => onChange({ oceanColor })} />
                        )}
                        <RadioButton value="bathy" label="Bathymetric tints" hint="A color ramp from deep to shallow water." />
                        {settings.bathymetry === "bathy" && (
                            <div className="grid grid-cols-2 gap-3 pl-6">
                                <ColorField label="Deep" value={settings.bathyDeepColor} onChange={(bathyDeepColor) => onChange({ bathyDeepColor })} />
                                <ColorField
                                    label="Shallow"
                                    value={settings.bathyShallowColor}
                                    onChange={(bathyShallowColor) => onChange({ bathyShallowColor })}
                                />
                            </div>
                        )}
                    </RadioGroup>
                </PanelSection>
            )}

            <PanelSection title="Map guides" description="Help for finding your area. Never included in downloads.">
                <Toggle
                    size="sm"
                    className="w-full [&>div:first-of-type]:shrink-0"
                    label="Show hillshade"
                    hint="Shaded relief under the contours."
                    isSelected={settings.showHillshade}
                    onChange={(showHillshade) => onChange({ showHillshade })}
                />
                <Toggle
                    size="sm"
                    className="w-full [&>div:first-of-type]:shrink-0"
                    label="Show roads and labels"
                    isSelected={settings.showLabels}
                    onChange={(showLabels) => onChange({ showLabels })}
                />
            </PanelSection>

            <p className="border-t border-secondary px-5 py-5 text-xs text-tertiary">
                Elevation comes from Mapzen&apos;s open terrain tiles, so contours cover the whole world.{" "}
                <a href={BLOG_POST_URL} target="_blank" rel="noopener" className="font-medium text-brand-secondary hover:text-brand-secondary_hover">
                    How it works
                </a>
                <span className="block pt-2 sm:hidden">
                    Made by{" "}
                    <a href={AXIS_MAPS_URL} target="_blank" rel="noopener" className="font-medium text-brand-secondary hover:text-brand-secondary_hover">
                        Axis Maps
                    </a>
                    .
                </span>
            </p>
        </>
    );
};
