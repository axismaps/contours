import { cx } from "@/utils/cx";

/** Nested contour rings on a brand tile: the app mark. */
export const ContoursLogo = ({ className }: { className?: string }) => (
    <span
        className={cx("flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-solid text-white shadow-xs-skeuomorphic", className)}
        aria-hidden="true"
    >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M3 12.5c0-4.5 4-7.5 9-7.5s9 3 9 7.5-4 6.5-9 6.5-9-2-9-6.5Z" />
            <path d="M6.5 12.5c0-2.6 2.4-4.5 5.5-4.5s5.5 1.9 5.5 4.5S15.1 16.5 12 16.5s-5.5-1.5-5.5-4Z" />
            <path d="M9.6 12.5c0-1 1.1-1.8 2.4-1.8s2.4.8 2.4 1.8-1.1 1.7-2.4 1.7-2.4-.7-2.4-1.7Z" />
        </svg>
    </span>
);
