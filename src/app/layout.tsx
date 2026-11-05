import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
    themeColor: "#ffffff",
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className="light-mode">
            <body className={cx(inter.variable, "overflow-hidden bg-primary antialiased")}>
                <RouteProvider>{children}</RouteProvider>
                <Analytics />
            </body>
        </html>
    );
}
