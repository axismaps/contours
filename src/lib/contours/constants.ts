import type { ContourSettings, MapPosition } from "./types";

/** Mapzen Terrarium elevation tiles, hosted on AWS. Keyless, max zoom 15. */
export const TERRARIUM_TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
export const TERRARIUM_ATTRIBUTION = 'Elevation: <a href="https://registry.opendata.aws/terrain-tiles/">Terrain Tiles</a> (Mapzen / AWS)';

/** Esri's keyless reference overlays: roads, then boundaries and place labels. */
export const ESRI_ROADS_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";
export const ESRI_PLACES_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
export const ESRI_ATTRIBUTION = 'Roads &amp; labels &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, OpenStreetMap contributors';

export const MAX_ZOOM = 15;

/** Extra pixels computed around the viewport so contour lines don't stop short of the edges. */
export const CANVAS_BUFFER = 5;

/** Elevation bands with fewer pixels than this are treated as junk when choosing thresholds. */
export const MIN_PIXELS_PER_BAND = 50;

/** Wait this long after the last move, tile load or setting change before recomputing. */
export const REDRAW_DELAY_MS = 500;
export const SEARCH_DELAY_MS = 250;

export const METERS_TO_FEET = 3.28084;

export const AXIS_MAPS_URL = "https://www.axismaps.com/";
export const AXIS_MAPS_LOGO_URL = "https://www.axismaps.com/axis-logo.png";
export const BLOG_POST_URL = "https://www.axismaps.com/blog/contour-maps-in-a-web-browser";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export const EXAMPLE_LOCATIONS: ReadonlyArray<{ name: string } & MapPosition> = [
    { name: "Mount Fuji", lat: 35.3577, lng: 138.7331, zoom: 13 },
    { name: "Big Island, Hawaii", lat: 19.6801, lng: -155.5132, zoom: 9 },
    { name: "Grand Canyon", lat: 36.0469, lng: -113.8416, zoom: 13 },
    { name: "Mount Everest", lat: 27.9885, lng: 86.9233, zoom: 12 },
    { name: "Mount Rainier", lat: 46.8358, lng: -121.7663, zoom: 11 },
    { name: "White Mountains", lat: 44.0859, lng: -71.4441, zoom: 11 },
];

export const randomExampleLocation = (): MapPosition => EXAMPLE_LOCATIONS[Math.floor(Math.random() * EXAMPLE_LOCATIONS.length)];

export const DEFAULT_SETTINGS: ContourSettings = {
    showLabels: true,
    mapType: "lines",
    interval: 500,
    unit: "ft",
    indexEvery: 0,

    lineColor: "#8c7556",
    lineWidth: 0.75,
    indexLineWidth: 1.5,

    highlightColor: "#fffbec",
    shadowColor: "#5b5143",
    shadowWidth: 2,

    background: "none",
    solidColor: "#fffcfa",
    hypsoLowColor: "#79a483",
    hypsoHighColor: "#ffdecb",

    bathymetry: "none",
    oceanColor: "#d5f2ff",
    bathyDeepColor: "#315d9b",
    bathyShallowColor: "#d5f2ff",
};
