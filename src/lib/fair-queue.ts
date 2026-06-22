import { prisma } from "@/lib/prisma";

const DAY_MS = 1000 * 60 * 60 * 24;

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

// visibility_score = (jours_sans_rencontre × 2) − (matches_7j × 5) − (sorties_30j × 3)
// Tri décroissant : plus le score est élevé, plus le profil/event apparaît en premier.
export async function updateVisibilityScore(userId: string) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const recentInterests = await prisma.interest.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const matchKeys = new Set<string>();
  for (const interest of recentInterests) {
    const otherId =
      interest.fromUserId === userId ? interest.toUserId : interest.fromUserId;
    const reciprocal = await prisma.interest.findFirst({
      where: { fromUserId: otherId, toUserId: userId, eventId: interest.eventId },
    });
    if (reciprocal) matchKeys.add(`${interest.eventId}_${otherId}`);
  }

  // Les matchs mutuels du swipe découverte comptent aussi comme un "succès récent".
  const recentLikedSwipes = await prisma.swipe.findMany({
    where: { fromUserId: userId, direction: "LIKE", createdAt: { gte: sevenDaysAgo } },
  });
  for (const swipe of recentLikedSwipes) {
    const reciprocal = await prisma.swipe.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: swipe.toUserId, toUserId: userId },
      },
    });
    if (reciprocal?.direction === "LIKE") matchKeys.add(`swipe_${swipe.toUserId}`);
  }

  const recentMatches = matchKeys.size;

  const recentMeetups = await prisma.eventParticipant.count({
    where: {
      userId,
      status: "ACCEPTED",
      event: { date: { gte: thirtyDaysAgo, lte: now } },
    },
  });

  const lastMeetup = await prisma.eventParticipant.findFirst({
    where: { userId, status: "ACCEPTED", event: { date: { lte: now } } },
    orderBy: { event: { date: "desc" } },
    include: { event: true },
  });
  const lastMeetupAt = lastMeetup?.event.date ?? null;

  const daysSinceLastMeetup = daysBetween(lastMeetupAt ?? user.createdAt, now);
  const visibilityScore =
    daysSinceLastMeetup * 2 - recentMatches * 5 - recentMeetups * 3;

  await prisma.user.update({
    where: { id: userId },
    data: { lastMeetupAt, recentMatches, recentMeetups, visibilityScore },
  });

  return visibilityScore;
}

export async function recomputeAllVisibilityScores() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const { id } of users) {
    await updateVisibilityScore(id);
  }
  return users.length;
}
