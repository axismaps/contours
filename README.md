# Contours

A tool for drawing and exporting simple contour maps of anywhere on Earth. Pick a place, tune the interval and style, then download GeoJSON, SVG or PNG. Live at https://contours.axismaps.com/.

Read more at https://www.axismaps.com/blog/contour-maps-in-a-web-browser

## How it works

Elevation comes from Mapzen's Terrarium tiles, decoded in the browser: each tile is drawn to an offscreen canvas, every pixel is turned back into metres, and [d3-contour](https://github.com/d3/d3-contour) traces contour polygons over the pixel grid at your chosen interval. The result is drawn to a canvas on top of a Leaflet map and can be exported as geodata or graphics.

## Stack

- [Next.js](https://nextjs.org/) (App Router) and TypeScript
- [Untitled UI React](https://www.untitledui.com/react) components on React Aria and Tailwind CSS v4
- [Leaflet](https://leafletjs.com/) 1.9 for the map, loaded client-side only
- d3-contour, d3-geo, d3-scale and d3-interpolate for the contouring and tints

## Data sources

- Elevation: [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Mapzen Terrarium PNGs on AWS), no key needed, max zoom 15.
- Roads and place labels: Esri's keyless `World_Transportation` and `World_Boundaries_and_Places` reference tiles.
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
npm start
```

`npm run typecheck` runs the TypeScript compiler on its own.

## Project layout

- `src/lib/contours/` – the contouring pipeline, framework-free: Terrarium decoding (`elevation.ts`), threshold selection (`thresholds.ts`), d3 contouring (`compute.ts`), canvas and SVG rendering (`draw.ts`), exports (`export.ts`), the URL hash (`hash.ts`), geocoding (`geocode.ts`) and the hidden Leaflet elevation layer (`terrarium-layer.ts`).
- `src/hooks/use-contour-map.ts` – owns the Leaflet map, the canvases and the debounced redraw pipeline, and exposes the download actions.
- `src/components/contours/` – the app shell: header with place search, tool rail, Style and Download panels.
- `src/components/base/`, `src/components/application/` – Untitled UI components, added with `npx untitledui@latest add <component>`.
- `src/styles/theme.css` – design tokens. The brand ramp is the contour brown; grays use Tailwind's warm `stone` scale.

## URL

The view is kept in the hash as `#zoom/lat/lng`, so any view can be linked to. Without a hash the app opens at one of a few example mountains.
