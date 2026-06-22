import { prisma } from "@/lib/prisma";

// Un groupe se forme automatiquement dès que la rencontre est passée (J+0, cf. cahier des charges 5.3).
export async function ensureGroupForEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { participants: { where: { status: "ACCEPTED" } } },
  });
  if (!event || event.participants.length < 2) return null;

  const group = await prisma.group.upsert({
    where: { eventId },
    create: { eventId },
    update: {},
  });

  await Promise.all(
    event.participants.map((participant) =>
      prisma.groupMember.upsert({
        where: { groupId_userId: { groupId: group.id, userId: participant.userId } },
        create: { groupId: group.id, userId: participant.userId },
        update: {},
      })
    )
  );

  return group;
}
