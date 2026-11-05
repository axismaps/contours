"use client";

import { useState } from "react";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";

interface NumberFieldProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    /** Smallest value that will be committed. */
    min?: number;
    /** Unit shown after the field, such as "px". */
    suffix?: string;
    isDisabled?: boolean;
    className?: string;
}

/**
 * A decimal field. The draft is committed as the user types whenever it
 * parses to a valid number, and snaps back to the last good value on blur.
 */
export const NumberField = ({ label, value, onChange, min = 0, suffix, isDisabled, className }: NumberFieldProps) => {
    const [draft, setDraft] = useState(String(value));
    const [lastValue, setLastValue] = useState(value);

    // Adopt a new value from outside unless the draft already parses to it (so "1." isn't clobbered mid-keystroke).
    if (value !== lastValue) {
        setLastValue(value);
        if (Number(draft) !== value) setDraft(String(value));
    }

    const parse = (text: string) => {
        const n = Number(text.trim());
        return text.trim() !== "" && Number.isFinite(n) && n >= min ? n : null;
    };

    const fieldProps = {
        value: draft,
        isDisabled,
        onChange: (text: string) => {
            setDraft(text);
            const n = parse(text);
            if (n !== null && n !== value) onChange(n);
        },
        onBlur: () => {
            if (parse(draft) === null) setDraft(String(value));
        },
    };

    if (suffix) {
        return (
            <InputGroup
                size="sm"
                label={label}
                className={className}
                inputClassName="tabular-nums"
                trailingAddon={<InputGroup.Prefix position="trailing">{suffix}</InputGroup.Prefix>}
                {...fieldProps}
            >
                <InputBase inputMode="decimal" />
            </InputGroup>
        );
    }

    return <Input size="sm" label={label} className={className} inputClassName="tabular-nums" inputMode="decimal" {...fieldProps} />;
};
