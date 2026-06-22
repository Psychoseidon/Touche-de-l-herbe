import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";

export async function GET(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          event: { select: { title: true, location: true } },
          members: { select: { userId: true } },
        },
      },
    },
    orderBy: { group: { lastActiveAt: "desc" } },
  });

  return NextResponse.json({
    groups: memberships.map((m) => m.group),
  });
}
