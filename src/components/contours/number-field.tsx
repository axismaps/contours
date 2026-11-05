"use client";

import { type KeyboardEvent, useState } from "react";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";

interface NumberFieldProps {
    label: string;
    hint?: string;
    value: number;
    onChange: (value: number) => void;
    /** Smallest value that will be committed. */
    min?: number;
    /** Unit shown after the field, such as "px". */
    suffix?: string;
    /**
     * When the draft reaches `onChange`: on every valid keystroke, or only on
     * Enter and blur. Use "blur" where intermediate values are costly, since
     * typing "100" passes through "1".
     */
    commitOn?: "change" | "blur";
    isDisabled?: boolean;
    className?: string;
}

/**
 * A decimal field. The draft is committed whenever it parses to a valid number
 * (as the user types, or on Enter and blur) and snaps back to the last good
 * value on blur otherwise.
 */
export const NumberField = ({ label, hint, value, onChange, min = 0, suffix, commitOn = "change", isDisabled, className }: NumberFieldProps) => {
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

    /** Commit the draft if it is valid; otherwise snap back to the current value. */
    const commit = () => {
        const n = parse(draft);
        if (n === null) setDraft(String(value));
        else if (n !== value) onChange(n);
    };

    const fieldProps = {
        value: draft,
        isDisabled,
        onChange: (text: string) => {
            setDraft(text);
            if (commitOn !== "change") return;
            const n = parse(text);
            if (n !== null && n !== value) onChange(n);
        },
        onBlur: commit,
        onKeyDown: (event: KeyboardEvent) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            commit();
        },
    };

    if (suffix) {
        return (
            <InputGroup
                size="sm"
                label={label}
                hint={hint}
                className={className}
                inputClassName="tabular-nums"
                trailingAddon={<InputGroup.Prefix position="trailing">{suffix}</InputGroup.Prefix>}
                {...fieldProps}
            >
                <InputBase inputMode="decimal" />
            </InputGroup>
        );
    }

    return <Input size="sm" label={label} hint={hint} className={className} inputClassName="tabular-nums" inputMode="decimal" {...fieldProps} />;
};
