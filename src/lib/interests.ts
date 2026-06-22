import { prisma } from "@/lib/prisma";

export async function findReciprocalInterest(
  fromUserId: string,
  toUserId: string,
  eventId: string
) {
  return prisma.interest.findFirst({
    where: { fromUserId: toUserId, toUserId: fromUserId, eventId },
  });
}

export async function hasMutualMatchWith(
  userId: string,
  otherId: string
): Promise<boolean> {
  const sent = await prisma.interest.findMany({
    where: { fromUserId: userId, toUserId: otherId },
  });

  for (const interest of sent) {
    const reciprocal = await findReciprocalInterest(
      userId,
      otherId,
      interest.eventId
    );
    if (reciprocal) return true;
  }

  return false;
}

export async function getMatchedUserIds(userId: string): Promise<Set<string>> {
  const sent = await prisma.interest.findMany({ where: { fromUserId: userId } });
  const matched = new Set<string>();

  for (const interest of sent) {
    const reciprocal = await findReciprocalInterest(
      interest.fromUserId,
      interest.toUserId,
      interest.eventId
    );
    if (reciprocal) matched.add(interest.toUserId);
  }

  return matched;
}
