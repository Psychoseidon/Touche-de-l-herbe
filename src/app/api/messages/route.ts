import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { getAllMatchedUserIds } from "@/lib/matches";
import { getConversationId } from "@/lib/conversation";

export async function GET(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const matchedIds = await getAllMatchedUserIds(userId);
  const matches = await prisma.user.findMany({
    where: { id: { in: Array.from(matchedIds) } },
    select: { id: true, pseudo: true, photo: true },
  });

  const conversations = await Promise.all(
    matches.map(async (user) => {
      const conversationId = getConversationId(userId, user.id);
      const lastMessage = await prisma.message.findFirst({
        where: { type: "DM", conversationId },
        orderBy: { createdAt: "desc" },
      });
      return { user, lastMessage };
    })
  );

  return NextResponse.json({ conversations });
}
