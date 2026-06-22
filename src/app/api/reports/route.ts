import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { z } from "zod";

const reportSchema = z.object({
  reportedId: z.string(),
  category: z.enum([
    "FAKE_PROFILE",
    "HARASSMENT",
    "INAPPROPRIATE_BEHAVIOR",
    "ILLEGAL_CONTENT",
  ]),
  details: z.string().max(1000).optional(),
  eventId: z.string().optional(),
});

export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { reportedId, category, details, eventId } = parsed.data;

  if (reportedId === userId) {
    return NextResponse.json(
      { error: "Tu ne peux pas te signaler toi-même" },
      { status: 400 }
    );
  }

  await prisma.report.create({
    data: {
      reporterId: userId,
      reportedId,
      category,
      details,
      eventId,
    },
  });

  const pendingCount = await prisma.report.count({
    where: { reportedId, status: "PENDING" },
  });

  // Suspension auto à 3 signalements distincts en attente (cf. cahier des charges 6.3).
  if (pendingCount >= 3) {
    await prisma.user.update({
      where: { id: reportedId },
      data: { suspended: true },
    });
  }

  return NextResponse.json({ success: true });
}
