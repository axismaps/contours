export interface PlaceResult {
    id: string;
    name: string;
    /** [lng, lat] */
    center: [number, number];
    /** [west, south, east, north] */
    bbox?: [number, number, number, number];
}

interface MapboxFeature {
    id: string;
    place_name: string;
    center: [number, number];
    bbox?: [number, number, number, number];
}

/** Forward-geocode a place name with the Mapbox Geocoding API. */
export async function geocodePlace(query: string, token: string, signal?: AbortSignal): Promise<PlaceResult[]> {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
    url.searchParams.set("language", "en");
    url.searchParams.set("types", "place,locality,neighborhood,poi");
    url.searchParams.set("access_token", token);

    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
    const json = (await response.json()) as { features?: MapboxFeature[] };
    return (json.features ?? []).map((f) => ({ id: f.id, name: f.place_name, center: f.center, bbox: f.bbox }));
}
