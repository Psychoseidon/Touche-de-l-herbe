import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { date: { gte: new Date() } },
    include: {
      creator: { select: { pseudo: true, photo: true, visibilityScore: true } },
      participants: { where: { status: "ACCEPTED" } },
    },
    orderBy: { creator: { visibilityScore: "desc" } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rencontres à venir</h1>
        <Link href="/events/new">
          <Button>Créer une rencontre</Button>
        </Link>
      </div>

      {events.length === 0 && (
        <p className="text-muted-foreground">
          Aucune rencontre pour le moment. Sois le premier à en proposer une !
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <Link key={event.id} href={`/events/${event.id}`}>
            <Card className="h-full transition hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Badge variant={event.radius === "national" ? "default" : "secondary"}>
                    {event.radius === "national" ? "National" : "Local"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="line-clamp-2">{event.description}</p>
                <p>📍 {event.location}</p>
                <p>
                  🗓️{" "}
                  {event.date.toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <p>
                  👥 {event.participants.length}/{event.maxSize} participants
                  {" · proposé par "}
                  {event.creator.pseudo}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
