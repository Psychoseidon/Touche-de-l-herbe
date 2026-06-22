const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

type Geolocated = { latitude: number | null; longitude: number | null };

// Filtre + trie une liste (sorties créées par des membres, suggestions
// externes...) par distance à un point donné. Sans coordonnées connues
// (ni pour l'item, ni pour l'utilisateur), l'item reste affiché plutôt que
// d'être masqué par défaut.
export function withDistance<T extends Geolocated>(
  items: T[],
  coords: { lat: number; lon: number } | null,
  radiusKm: number
): { item: T; distanceKm: number | null }[] {
  return items
    .map((item) => ({
      item,
      distanceKm:
        coords && item.latitude !== null && item.longitude !== null
          ? haversineDistanceKm(coords.lat, coords.lon, item.latitude, item.longitude)
          : null,
    }))
    .filter(({ distanceKm }) => distanceKm === null || distanceKm <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

// Géocodage best-effort via Nominatim (OpenStreetMap) — gratuit, sans clé API.
// Respecte la politique d'usage (1 req/s, User-Agent descriptif) ; renvoie
// null si l'adresse n'est pas trouvée plutôt que de faire échouer la création.
export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "touche-de-lherbe (contact: admin@touchedelherbe.local)" },
    });
    if (!res.ok) return null;

    const results = await res.json();
    const first = results?.[0];
    if (!first) return null;

    return { latitude: parseFloat(first.lat), longitude: parseFloat(first.lon) };
  } catch {
    return null;
  }
}
