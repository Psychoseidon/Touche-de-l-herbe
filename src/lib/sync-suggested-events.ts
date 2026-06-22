import { prisma } from "@/lib/prisma";
import { fetchOpenAgendaSuggestions } from "@/lib/openagenda";
import { fetchParisOpenDataSuggestions } from "@/lib/paris-opendata";

export async function syncSuggestedEvents(): Promise<number> {
  const [openAgenda, parisOpenData] = await Promise.all([
    fetchOpenAgendaSuggestions(),
    fetchParisOpenDataSuggestions(),
  ]);
  const suggestions = [...openAgenda, ...parisOpenData];
  const syncedAt = new Date();

  for (const suggestion of suggestions) {
    await prisma.suggestedEvent.upsert({
      where: { externalId: suggestion.externalId },
      create: { ...suggestion, lastSeenAt: syncedAt },
      update: { ...suggestion, lastSeenAt: syncedAt },
    });
  }

  // Les sorties passées sont retirées (qu'elles aient été resynchronisées ou
  // que la source ne les publie plus).
  await prisma.suggestedEvent.deleteMany({
    where: { date: { lt: syncedAt } },
  });

  return suggestions.length;
}
