import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { RouteProvider } from "@/providers/router-provider";
import "@/styles/globals.css";
import { cx } from "@/utils/cx";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "Contours",
    description: "Draw and export simple contour maps of anywhere on Earth. Pick a place, tune the interval and style, then download GeoJSON, SVG or PNG.",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
    ],
    width: "device-width",
    initialScale: 1,
};

/**
 * Follow the OS colour scheme by toggling the theme classes on <html>. Runs before
 * the first paint so dark-mode users never flash a white page.
 */
const colorSchemeScript = `(function () {
    var dark = window.matchMedia("(prefers-color-scheme: dark)");
    function apply() {
        document.documentElement.classList.toggle("dark-mode", dark.matches);
        document.documentElement.classList.toggle("light-mode", !dark.matches);
    }
    apply();
    dark.addEventListener("change", apply);
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        // The script rewrites the class before hydration, so React's "light-mode" is only a fallback.
        <html lang="en" className="light-mode" suppressHydrationWarning>
            <head>
                <Script id="color-scheme" strategy="beforeInteractive">
                    {colorSchemeScript}
                </Script>
            </head>
            <body className={cx(inter.variable, "overflow-hidden bg-primary antialiased")}>
                <RouteProvider>{children}</RouteProvider>
            </body>
        </html>
    );
}
