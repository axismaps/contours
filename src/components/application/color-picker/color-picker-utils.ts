import type React from "react";

export type ColorDisplayFormat = "hex" | "rgb" | "css" | "hsl" | "hsb";

export const selectAllOnFocus: React.FocusEventHandler<HTMLInputElement> = (e) => e.target.select();
