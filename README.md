# contours

A tool for drawing and exporting simple contour maps. https://contours.axismaps.com/

Read more at https://www.axismaps.com/blog/contour-maps-in-a-web-browser

## Data sources

- Elevation: [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Mapzen Terrarium PNGs on AWS), no key needed.
- Roads and place labels: Esri's keyless `World_Transportation` and `World_Boundaries_and_Places` reference tiles. These replaced the Stamen label tiles, whose server shut down in 2023.
- Place search: Mapbox Geocoding, using the token in `contours.js`.

## Running locally

It is a static site. Serve the folder with any web server, for example:

    python3 -m http.server 8765

then open http://localhost:8765/.
