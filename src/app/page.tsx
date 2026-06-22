import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StartCta } from "@/components/start-cta";
import { LocalEvents } from "@/components/local-events";

export default async function Home() {
  const session = await auth();

  const [events, suggestions] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: new Date() } },
      include: {
        creator: { select: { pseudo: true } },
        participants: { where: { status: "ACCEPTED" }, select: { id: true } },
      },
      orderBy: { creator: { visibilityScore: "desc" } },
      take: 30,
    }),
    prisma.suggestedEvent.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 9,
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center gap-16 px-4 py-16 text-center">
      <div className="flex max-w-3xl flex-col items-center gap-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Des rencontres réelles, pas un algorithme.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Viens toucher de l&apos;herbe est une application de rencontres IRL basée sur
          des événements de groupe et une découverte par swipe. Équité
          radicale, pas d&apos;algorithme caché, pas de premium — juste de
          vraies sorties.
        </p>

        <StartCta isAuthenticated={Boolean(session?.user)} />

        <div className="grid gap-4 pt-4 text-left sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Équité radicale</h2>
            <p className="text-sm text-muted-foreground">
              Aucun profil favorisé par l&apos;argent ou la popularité.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Rencontre réelle</h2>
            <p className="text-sm text-muted-foreground">
              L&apos;IRL est le produit, pas le match.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Rétention par la valeur</h2>
            <p className="text-sm text-muted-foreground">
              On reste parce que l&apos;app enrichit notre vie sociale.
            </p>
          </div>
        </div>
      </div>

      <LocalEvents
        events={events.map((event) => ({
          ...event,
          date: event.date.toISOString(),
        }))}
        suggestions={suggestions.map((suggestion) => ({
          ...suggestion,
          date: suggestion.date.toISOString(),
        }))}
      />
    </div>
  );
}
