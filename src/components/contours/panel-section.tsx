import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

/** A titled block of a side panel. */
export const PanelSection = ({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description?: ReactNode;
    children: ReactNode;
    className?: string;
}) => (
    <section className={cx("flex flex-col gap-4 border-t border-secondary px-5 py-5", className)}>
        <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
            {description && <p className="text-sm text-tertiary">{description}</p>}
        </div>
        {children}
    </section>
);
