// Intégration OpenAgenda (https://openagenda.com) : agrégateur français
// d'événements, open-data, API publique gratuite (clé requise). Choisi pour
// la suggestion de sorties externes plutôt que du scraping de sites tiers,
// qui pose des problèmes légaux (CGU) et casse à chaque changement de HTML.
//
// Interroge plusieurs agendas en parallèle (offices de tourisme, lieux,
// associations...) pour un effet "que faire à <ville>" sans dépendre d'une
// seule source. OPENAGENDA_AGENDAS : liste séparée par des virgules de
// "uid" ou "uid:slug" (le slug sert juste à construire le lien "voir la
// source", absent si non fourni).

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

type AgendaConfig = { uid: string; slug?: string };

function parseAgendaConfigs(): AgendaConfig[] {
  const raw = process.env.OPENAGENDA_AGENDAS;
  if (!raw) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [uid, slug] = entry.split(":").map((part) => part.trim());
      return { uid, slug: slug || undefined };
    });
}

function localize(value: OpenAgendaMultilingual): string {
  if (typeof value === "string") return value;
  if (value) return value.fr ?? Object.values(value)[0] ?? "";
  return "";
}

async function fetchAgendaEvents(
  key: string,
  agenda: AgendaConfig
): Promise<NormalizedSuggestedEvent[]> {
  const url = new URL(`https://api.openagenda.com/v2/agendas/${agenda.uid}/events`);
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
        sourceUrl: agenda.slug
          ? `https://openagenda.com/${agenda.slug}/events/${event.slug}`
          : `https://openagenda.com/events/${event.slug}`,
      };
    });
}

export async function fetchOpenAgendaSuggestions(): Promise<NormalizedSuggestedEvent[]> {
  const key = process.env.OPENAGENDA_PUBLIC_KEY;
  const agendas = parseAgendaConfigs();
  if (!key || agendas.length === 0) return [];

  const results = await Promise.all(
    agendas.map((agenda) => fetchAgendaEvents(key, agenda))
  );

  const byId = new Map<string, NormalizedSuggestedEvent>();
  for (const suggestion of results.flat()) {
    byId.set(suggestion.externalId, suggestion);
  }
  return [...byId.values()];
}
