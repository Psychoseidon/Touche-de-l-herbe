import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { groupId } = await params;
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      event: { select: { title: true, location: true, createdAt: true } },
      members: { include: { user: { select: { id: true, pseudo: true } } } },
    },
  });
  if (!group) {
    return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
  }

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) {
    return NextResponse.json({ error: "Non membre de ce groupe" }, { status: 403 });
  }

  return NextResponse.json({ group });
}
