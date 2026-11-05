# Contours

A tool for drawing and exporting simple contour maps of anywhere on Earth. Pick a place, tune the interval and style, then download GeoJSON, SVG or PNG. Live at https://contours.axismaps.com/.

Read more at https://www.axismaps.com/blog/contour-maps-in-a-web-browser

## How it works

Elevation comes from Mapzen's Terrarium tiles, decoded in the browser: each tile is drawn to an offscreen canvas, every pixel is turned back into metres, and [d3-contour](https://github.com/d3/d3-contour) traces contour polygons over the pixel grid at your chosen interval. The result is drawn to a canvas on top of a Leaflet map, tinted by elevation by default, and can be exported as geodata or graphics. A faint Esri hillshade is multiplied over the canvas on screen for orientation.

## Stack

- [Next.js](https://nextjs.org/) (App Router) and TypeScript
- [Untitled UI React](https://www.untitledui.com/react) components on React Aria and Tailwind CSS v4
- [Leaflet](https://leafletjs.com/) 1.9 for the map, loaded client-side only
- d3-contour, d3-geo, d3-scale and d3-interpolate for the contouring and tints

## Data sources

- Elevation: [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Mapzen Terrarium PNGs on AWS), no key needed, max zoom 15.
- Hillshade, roads and place labels: Esri's keyless `World_Hillshade`, `World_Transportation` and `World_Light_Gray_Reference` tiles. They are guides for finding a place and never appear in downloads.
- Place search: the Mapbox Geocoding API, with the public token in `NEXT_PUBLIC_MAPBOX_TOKEN`.

## Running locally

Requires Node 20 or newer.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Then open http://localhost:3000/. Without `NEXT_PUBLIC_MAPBOX_TOKEN` the app still works, but the place search is disabled.

## Building

```bash
npm run build
```

The app is configured as a static export (`output: "export"` in `next.config.mjs`), so `next build` writes the whole site to `out/` as plain HTML, JS and CSS. There is no server to run: preview the build with any file server, for example

```bash
npm start
```

which runs `npx serve out`, or `python3 -m http.server 8787 --directory out`. `npm run typecheck` runs the TypeScript compiler on its own.

## Deploying

### Static hosting (contours.axismaps.com)

The site is entirely client-side (Leaflet, d3 and the Mapbox geocoder all run in the browser), so the exported `out/` folder is the deployable: copy its contents to the web root of any static host, exactly as the old `index.html` site was deployed.

1. Make sure `NEXT_PUBLIC_MAPBOX_TOKEN` is set when you build (in `.env.local` locally, or as an environment variable in CI). It is baked into the JavaScript at build time; without it the site works but search is disabled.
2. Run `npm run build`.
3. Upload the contents of `out/` to the host's document root.

Things the host needs to get right:

- **Serve from the domain root.** Asset URLs are root-absolute (`/_next/static/...`, `/icon.svg`). To host under a sub-path such as `example.com/contours/`, set `basePath: "/contours"` in `next.config.mjs` and rebuild; there is no `assetPrefix` or CDN setting otherwise.
- **`/` must serve `out/index.html`.** Every file server does this by default. `trailingSlash` is left at its default; the app has a single route, so it makes no difference here.
- **The map view lives in the URL hash** (`#zoom/lat/lng`), which never reaches the server, so no rewrite rules are needed for deep links.
- **Caching.** Everything under `out/_next/static/` has a content hash in its name and can be cached forever. `index.html` and `icon.svg` should be served with a short or no cache so a new deploy is picked up.
- **404s.** `out/404.html` is a styled not-found page; point the host's error document at it if it supports one. Nothing in the app depends on it.

The GitHub Actions workflow in `.github/workflows/build.yml` runs `npm ci` and `npm run build` on every push and pull request, reading the Mapbox token from the `NEXT_PUBLIC_MAPBOX_TOKEN` repository secret, and uploads `out/` as a workflow artifact named `site`. It does not deploy anywhere; download the artifact or add a deploy step for whichever host is chosen.

### Vercel

The same code runs unchanged on Vercel: import the repository, set `NEXT_PUBLIC_MAPBOX_TOKEN` in the project's environment variables, and Vercel detects Next.js and serves the static export.

## Project layout

- `src/lib/contours/` – the contouring pipeline, framework-free: Terrarium decoding (`elevation.ts`), threshold selection (`thresholds.ts`), d3 contouring (`compute.ts`), canvas and SVG rendering (`draw.ts`), exports (`export.ts`), the URL hash (`hash.ts`), geocoding (`geocode.ts`) and the hidden Leaflet elevation layer (`terrarium-layer.ts`).
- `src/hooks/use-contour-map.ts` – owns the Leaflet map, the canvases and the debounced redraw pipeline, and exposes the download actions.
- `src/components/contours/` – the app shell: header with place search and the Download menu, the collapsible Style sidebar (a bottom sheet on phones), and the map view.
- `src/components/base/`, `src/components/application/` – Untitled UI components, added with `npx untitledui@latest add <component>`.
- `src/styles/theme.css` – design tokens. The brand ramp is the contour brown; grays use Tailwind's warm `stone` scale.

## URL

The view is kept in the hash as `#zoom/lat/lng`, so any view can be linked to. Without a hash the app opens at one of a few example mountains.
