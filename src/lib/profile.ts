export function parsePhotos(photos: string | null): string[] {
  if (!photos) return [];
  try {
    const parsed = JSON.parse(photos);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string") : [];
  } catch {
    return [];
  }
}

export function parseInterests(interests: string | null): string[] {
  if (!interests) return [];
  return interests
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
