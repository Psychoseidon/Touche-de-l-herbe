import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (me?.suspended) {
    return NextResponse.json({ error: "Compte suspendu" }, { status: 403 });
  }

  const { id: eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { participants: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Rencontre introuvable" }, { status: 404 });
  }

  const acceptedCount = event.participants.filter(
    (p) => p.status === "ACCEPTED"
  ).length;
  if (acceptedCount >= event.maxSize) {
    return NextResponse.json({ error: "Groupe complet" }, { status: 409 });
  }

  const existing = event.participants.find((p) => p.userId === userId);
  if (existing) {
    return NextResponse.json(
      { error: "Tu as déjà rejoint ou demandé à rejoindre cette rencontre" },
      { status: 409 }
    );
  }

  const participant = await prisma.eventParticipant.create({
    data: {
      eventId,
      userId,
      status: event.autoAccept ? "ACCEPTED" : "PENDING",
    },
  });

  return NextResponse.json({ status: participant.status });
}
