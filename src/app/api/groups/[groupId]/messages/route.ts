import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { getPusherServer } from "@/lib/pusher";
import { z } from "zod";

async function assertMember(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return Boolean(member);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { groupId } = await params;
  if (!(await assertMember(groupId, userId))) {
    return NextResponse.json({ error: "Non membre de ce groupe" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { type: "GROUP", groupId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, pseudo: true, photo: true } } },
  });

  return NextResponse.json({ messages });
}

const sendSchema = z.object({ content: z.string().min(1).max(2000) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { groupId } = await params;
  if (!(await assertMember(groupId, userId))) {
    return NextResponse.json({ error: "Non membre de ce groupe" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      content: parsed.data.content,
      type: "GROUP",
      senderId: userId,
      groupId,
    },
    include: { sender: { select: { id: true, pseudo: true, photo: true } } },
  });

  await prisma.group.update({
    where: { id: groupId },
    data: { lastActiveAt: new Date() },
  });

  const pusher = getPusherServer();
  if (pusher) {
    await pusher.trigger(`group-${groupId}`, "new-message", message);
  }

  return NextResponse.json({ message });
}
