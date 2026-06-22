import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { isMatched } from "@/lib/matches";
import { getConversationId } from "@/lib/conversation";
import { getPusherServer } from "@/lib/pusher";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { userId: otherId } = await params;
  const matched = await isMatched(userId, otherId);
  if (!matched) {
    return NextResponse.json({ error: "Aucun match avec cet utilisateur" }, { status: 403 });
  }

  const conversationId = getConversationId(userId, otherId);
  const messages = await prisma.message.findMany({
    where: { type: "DM", conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, pseudo: true, photo: true } } },
  });

  return NextResponse.json({ messages });
}

const sendSchema = z.object({ content: z.string().min(1).max(2000) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { userId: otherId } = await params;
  const matched = await isMatched(userId, otherId);
  if (!matched) {
    return NextResponse.json({ error: "Aucun match avec cet utilisateur" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  }

  const conversationId = getConversationId(userId, otherId);
  const message = await prisma.message.create({
    data: {
      content: parsed.data.content,
      type: "DM",
      senderId: userId,
      recipientId: otherId,
      conversationId,
    },
    include: { sender: { select: { id: true, pseudo: true, photo: true } } },
  });

  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(`conversation-${conversationId}`, "new-message", message);
  }

  return NextResponse.json({ message });
}
