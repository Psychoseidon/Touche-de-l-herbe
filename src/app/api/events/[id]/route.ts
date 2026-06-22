import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { isPastDate } from "@/lib/dates";
import { ensureGroupForEvent } from "@/lib/groups";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getRequestUserId(request);

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, pseudo: true, photo: true } },
      participants: {
        include: { user: { select: { id: true, pseudo: true, photo: true } } },
      },
    },
  });
  if (!event) {
    return NextResponse.json({ error: "Rencontre introuvable" }, { status: 404 });
  }

  const accepted = event.participants.filter((p) => p.status === "ACCEPTED");
  const pending = event.participants.filter((p) => p.status === "PENDING");
  const isCreator = userId === event.creatorId;
  const myParticipation = event.participants.find((p) => p.userId === userId);
  const isPast = isPastDate(event.date);
  const iAttended = myParticipation?.status === "ACCEPTED";

  let groupId: string | null = null;
  let otherParticipants: { id: string; pseudo: string }[] = [];
  let sentToIds: string[] = [];
  const matchedIds: string[] = [];

  if (isPast) {
    const group = await ensureGroupForEvent(event.id);
    groupId = group?.id ?? null;
  }

  if (isPast && iAttended && userId) {
    otherParticipants = accepted
      .filter((p) => p.userId !== userId)
      .map((p) => ({ id: p.user.id, pseudo: p.user.pseudo }));

    const myInterests = await prisma.interest.findMany({
      where: { fromUserId: userId, eventId: event.id },
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

  return NextResponse.json({
    event,
    accepted,
    pending,
    isCreator,
    myParticipation: myParticipation ?? null,
    isPast,
    iAttended,
    groupId,
    otherParticipants,
    sentToIds,
    matchedIds,
  });
}
