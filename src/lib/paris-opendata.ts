// Intégration Open Data Paris (https://opendata.paris.fr) : jeu de données
// "que-faire-a-paris-", soit le contenu officiel du site quefaire.paris.fr
// (concerts, expos, ateliers, festivals...) publié par la Ville de Paris en
// licence ouverte. Beaucoup plus riche que OpenAgenda pour Paris (~2700+
// événements vs quelques dizaines), zéro clé requise, zéro scraping : c'est
// une donnée publique structurée, pas l'extraction d'un site tiers.

import type { NormalizedSuggestedEvent } from "@/lib/openagenda";

type ParisEventRecord = {
  event_id: number;
  url?: string;
  title?: string;
  lead_text?: string;
  description?: string;
  date_start?: string;
  address_name?: string;
  address_street?: string;
  address_city?: string;
  lat_lon?: { lat: number; lon: number };
  qfap_tags?: string;
};

const DATASET_URL =
  "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const PAGE_SIZE = 100;
const MAX_PAGES = 4; // 400 événements à venir, largement assez pour le filtre rayon/intérêts côté client

async function fetchPage(offset: number): Promise<ParisEventRecord[]> {
  const url = new URL(DATASET_URL);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("where", "date_start>=now()");
  url.searchParams.set("order_by", "date_start asc");

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data?.results) ? data.results : [];
}

export async function fetchParisOpenDataSuggestions(): Promise<NormalizedSuggestedEvent[]> {
  const pages = await Promise.all(
    Array.from({ length: MAX_PAGES }, (_, i) => fetchPage(i * PAGE_SIZE))
  );
  const records = pages.flat();

  return records
    .filter((event) => event.date_start && event.title)
    .map((event) => {
      const place = [event.address_name, event.address_street, event.address_city]
        .filter(Boolean)
        .join(" — ");

      return {
        externalId: `paris-opendata:${event.event_id}`,
        source: "paris-opendata",
        title: event.title || "Sortie sans titre",
        description: event.lead_text || stripHtml(event.description || ""),
        location: place || "Paris",
        latitude: event.lat_lon?.lat ?? null,
        longitude: event.lat_lon?.lon ?? null,
        date: new Date(event.date_start!),
        sourceUrl: event.url || "https://quefaire.paris.fr",
        tags: event.qfap_tags || null,
      };
    });
}
