import { prisma } from "@/lib/prisma";
import { hasMutualMatchWith, getMatchedUserIds } from "@/lib/interests";

export async function hasMutualSwipeMatch(
  userId: string,
  otherId: string
): Promise<boolean> {
  const sent = await prisma.swipe.findUnique({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId: otherId } },
  });
  if (sent?.direction !== "LIKE") return false;

  const reciprocal = await prisma.swipe.findUnique({
    where: { fromUserId_toUserId: { fromUserId: otherId, toUserId: userId } },
  });
  return reciprocal?.direction === "LIKE";
}

// Une conversation se débloque soit via le double opt-in post-rencontre, soit
// via un match mutuel sur le swipe découverte.
export async function isMatched(userId: string, otherId: string): Promise<boolean> {
  if (await hasMutualMatchWith(userId, otherId)) return true;
  return hasMutualSwipeMatch(userId, otherId);
}

export async function getAllMatchedUserIds(userId: string): Promise<Set<string>> {
  const fromInterests = await getMatchedUserIds(userId);

  const likedSwipes = await prisma.swipe.findMany({
    where: { fromUserId: userId, direction: "LIKE" },
    select: { toUserId: true },
  });
  for (const { toUserId } of likedSwipes) {
    const reciprocal = await prisma.swipe.findUnique({
      where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: userId } },
    });
    if (reciprocal?.direction === "LIKE") fromInterests.add(toUserId);
  }

  return fromInterests;
}
