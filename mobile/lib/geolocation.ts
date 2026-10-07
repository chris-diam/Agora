import * as Location from "expo-location";

export interface DetectedLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Mirrors the web app's CreateEventPage.tsx: reverse-geocodes via Nominatim
// (OpenStreetMap's free, keyless geocoder) rather than asking the user to
// type a city/country — no API key/billing setup needed.
const reverseGeocode = async (latitude: number, longitude: number): Promise<DetectedLocation | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const body = await res.json();
    const address = body.address ?? {};
    const city = address.city ?? address.town ?? address.village ?? address.municipality ?? address.county;
    const country = address.country;
    if (!city || !country) return null;
    return { city, country, latitude, longitude };
  } catch {
    return null;
  }
};

// Best-effort — returns null on denied permission, a disabled location
// service, or any failure, so callers can fall back to the user's profile
// city/country without blocking on it.
export const detectLocation = async (): Promise<DetectedLocation | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const position = await Location.getCurrentPositionAsync({});
    return await reverseGeocode(position.coords.latitude, position.coords.longitude);
  } catch {
    return null;
  }
};
