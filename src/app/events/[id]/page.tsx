import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EventJoinButton } from "@/components/event-join-button";
import { ParticipantRequestRow } from "@/components/participant-request-row";
import { InterestPanel } from "@/components/interest-panel";
import { ensureGroupForEvent } from "@/lib/groups";
import { isPastDate } from "@/lib/dates";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, pseudo: true, photo: true } },
      participants: {
        include: { user: { select: { id: true, pseudo: true, photo: true } } },
      },
    },
  });

  if (!event) notFound();

  const accepted = event.participants.filter((p) => p.status === "ACCEPTED");
  const pending = event.participants.filter((p) => p.status === "PENDING");

  const isCreator = session?.user?.id === event.creatorId;
  const myParticipation = event.participants.find(
    (p) => p.userId === session?.user?.id
  );
  const canJoin =
    session?.user && !isCreator && !myParticipation && accepted.length < event.maxSize;

  const isPast = isPastDate(event.date);
  const iAttended = myParticipation?.status === "ACCEPTED";

  const group = isPast ? await ensureGroupForEvent(event.id) : null;

  let otherParticipants: { id: string; pseudo: string }[] = [];
  let sentToIds: string[] = [];
  const matchedIds: string[] = [];

  if (isPast && iAttended && session?.user) {
    otherParticipants = accepted
      .filter((p) => p.userId !== session.user.id)
      .map((p) => ({ id: p.user.id, pseudo: p.user.pseudo }));

    const myInterests = await prisma.interest.findMany({
      where: { fromUserId: session.user.id, eventId: event.id },
    });
    sentToIds = myInterests.map((i) => i.toUserId);

    for (const interest of myInterests) {
      const reciprocal = await prisma.interest.findFirst({
        where: {
          fromUserId: interest.toUserId,
          toUserId: interest.fromUserId,
          eventId: interest.eventId,
        },
      });
      if (reciprocal) matchedIds.push(interest.toUserId);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            <Badge variant={event.radius === "national" ? "default" : "secondary"}>
              {event.radius === "national" ? "National" : "Local"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>{event.description}</p>
          <div className="grid gap-1 text-sm text-muted-foreground">
            <p>📍 {event.location}</p>
            <p>
              🗓️{" "}
              {event.date.toLocaleString("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p>
              👥 {accepted.length}/{event.maxSize} participants ({event.minSize}{" "}
              min.)
            </p>
            <p>
              Proposé par{" "}
              <Link href={`/profile/${event.creator.id}`} className="underline">
                {event.creator.pseudo}
              </Link>
            </p>
          </div>

          {canJoin && <EventJoinButton eventId={event.id} />}
          {myParticipation?.status === "PENDING" && (
            <p className="text-sm text-muted-foreground">
              Ta demande est en attente de validation par le créateur.
            </p>
          )}

          <div>
            <h2 className="mb-2 font-medium">Participants confirmés</h2>
            <div className="flex flex-wrap gap-3">
              {accepted.map((p) => (
                <Link
                  key={p.id}
                  href={`/profile/${p.user.id}`}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={p.user.photo ?? undefined} />
                    <AvatarFallback>
                      {p.user.pseudo.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {p.user.pseudo}
                </Link>
              ))}
            </div>
          </div>

          {isPast && iAttended && group && (
            <Link href={`/groups/${group.id}`} className="underline text-sm">
              Voir le groupe persistant de cette sortie →
            </Link>
          )}

          {isPast && iAttended && (
            <InterestPanel
              eventId={event.id}
              participants={otherParticipants}
              sentToIds={sentToIds}
              matchedIds={matchedIds}
            />
          )}

          {isCreator && pending.length > 0 && (
            <div>
              <h2 className="mb-2 font-medium">Demandes en attente</h2>
              <div className="space-y-2">
                {pending.map((p) => (
                  <ParticipantRequestRow
                    key={p.id}
                    eventId={event.id}
                    participantId={p.id}
                    pseudo={p.user.pseudo}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
