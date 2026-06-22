// Intégration OpenAgenda (https://openagenda.com) : agrégateur français
// d'événements, open-data, API publique gratuite (clé requise). Choisi pour
// la suggestion de sorties externes plutôt que du scraping de sites tiers,
// qui pose des problèmes légaux (CGU) et casse à chaque changement de HTML.
//
// Limité à un seul "agenda" (= une ville/structure) pour la phase de test :
// OPENAGENDA_AGENDA_UID identifie l'agenda OpenAgenda à suivre.

type OpenAgendaMultilingual = string | Record<string, string> | undefined;

type OpenAgendaEvent = {
  uid: number;
  slug: string;
  title?: OpenAgendaMultilingual;
  description?: OpenAgendaMultilingual;
  timings?: { begin: string; end: string }[];
  location?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
};

export type NormalizedSuggestedEvent = {
  externalId: string;
  source: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  date: Date;
  sourceUrl: string;
};

function localize(value: OpenAgendaMultilingual): string {
  if (typeof value === "string") return value;
  if (value) return value.fr ?? Object.values(value)[0] ?? "";
  return "";
}

export async function fetchOpenAgendaSuggestions(): Promise<NormalizedSuggestedEvent[]> {
  const key = process.env.OPENAGENDA_PUBLIC_KEY;
  const agendaUid = process.env.OPENAGENDA_AGENDA_UID;
  if (!key || !agendaUid) return [];

  const agendaSlug = process.env.OPENAGENDA_AGENDA_SLUG;
  const url = new URL(`https://api.openagenda.com/v2/agendas/${agendaUid}/events`);
  url.searchParams.set("key", key);
  url.searchParams.set("relative[]", "upcoming");
  url.searchParams.set("size", "50");
  url.searchParams.set("sort", "timings.asc");

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  const events: OpenAgendaEvent[] = Array.isArray(data?.events) ? data.events : [];

  return events
    .filter((event) => event.timings?.[0]?.begin)
    .map((event) => {
      const place = [event.location?.name, event.location?.address]
        .filter(Boolean)
        .join(" — ");

      return {
        externalId: `openagenda:${event.uid}`,
        source: "openagenda",
        title: localize(event.title) || "Sortie sans titre",
        description: localize(event.description),
        location: place || "Lieu à confirmer",
        latitude: event.location?.latitude ?? null,
        longitude: event.location?.longitude ?? null,
        date: new Date(event.timings![0]!.begin),
        sourceUrl: agendaSlug
          ? `https://openagenda.com/${agendaSlug}/events/${event.slug}`
          : `https://openagenda.com/events/${event.slug}`,
      };
    });
}
