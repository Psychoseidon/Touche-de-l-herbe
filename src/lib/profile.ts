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

// Correspondance simple par mot-clé entre les centres d'intérêt d'un membre
// et le titre/description d'une suggestion externe (pas de catégorie
// structurée côté OpenAgenda) — renvoie les tags qui matchent.
export function matchingInterests(text: string, interests: string[]): string[] {
  const lower = text.toLowerCase();
  return interests.filter((tag) => tag.length > 0 && lower.includes(tag.toLowerCase()));
}
