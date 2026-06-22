import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { findReciprocalInterest } from "@/lib/interests";
import { updateVisibilityScore } from "@/lib/fair-queue";
import { getAge, canInteract } from "@/lib/age";
import { z } from "zod";

const interestSchema = z.object({
  toUserId: z.string(),
  eventId: z.string(),
  type: z.enum(["FRIENDLY", "ROMANTIC", "BOTH"]),
});

export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = interestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { toUserId, eventId, type } = parsed.data;
  if (toUserId === userId) {
    return NextResponse.json({ error: "Action impossible" }, { status: 400 });
  }

  const bothParticipated = await prisma.eventParticipant.count({
    where: {
      eventId,
      status: "ACCEPTED",
      userId: { in: [userId, toUserId] },
    },
  });
  if (bothParticipated < 2) {
    return NextResponse.json(
      { error: "Vous n'avez pas participé ensemble à cette rencontre" },
      { status: 403 }
    );
  }

  const [me, other] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.user.findUnique({ where: { id: toUserId } }),
  ]);
  if (!canInteract(getAge(me?.birthDate ?? null), getAge(other?.birthDate ?? null))) {
    return NextResponse.json({ error: "Interaction non autorisée" }, { status: 403 });
  }

  try {
    await prisma.interest.create({
      data: { fromUserId: userId, toUserId, eventId, type },
    });
  } catch {
    return NextResponse.json(
      { error: "Tu as déjà signalé un intérêt pour cette personne" },
      { status: 409 }
    );
  }

  const reciprocal = await findReciprocalInterest(userId, toUserId, eventId);
  const matched = Boolean(reciprocal);

  if (matched) {
    await updateVisibilityScore(userId);
    await updateVisibilityScore(toUserId);
  }

  return NextResponse.json({ matched });
}
