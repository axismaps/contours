/** @type {import('next').NextConfig} */
const nextConfig = {
    // Static export: `next build` writes a self-contained `out/` folder that any
    // file server (including the existing contours.axismaps.com host) can serve.
    // The same config also runs unchanged on Vercel, which serves the export.
    output: "export",
    // The only <img> is the external Axis Maps logo; the image optimizer needs a
    // server, so it is turned off for the export.
    images: {
        unoptimized: true,
    },
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
};

export default nextConfig;
