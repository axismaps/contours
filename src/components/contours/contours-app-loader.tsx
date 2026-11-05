"use client";

import dynamic from "next/dynamic";

/** Leaflet touches `window` on import, so the whole app is loaded client-side only. */
export const ContoursAppLoader = dynamic(() => import("./contours-app").then((m) => m.ContoursApp), {
    ssr: false,
    loading: () => <div className="h-dvh w-full bg-primary" aria-busy="true" />,
});
