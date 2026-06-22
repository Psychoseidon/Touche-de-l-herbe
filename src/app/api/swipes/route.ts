import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { getAge, canInteract } from "@/lib/age";
import { updateVisibilityScore } from "@/lib/fair-queue";
import { z } from "zod";

const swipeSchema = z.object({
  toUserId: z.string(),
  direction: z.enum(["LIKE", "PASS"]),
});

export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = swipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { toUserId, direction } = parsed.data;
  if (toUserId === userId) {
    return NextResponse.json({ error: "Action impossible" }, { status: 400 });
  }

  const [me, other] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.user.findUnique({ where: { id: toUserId } }),
  ]);
  if (!other) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }
  if (!canInteract(getAge(me?.birthDate ?? null), getAge(other.birthDate))) {
    return NextResponse.json({ error: "Interaction non autorisée" }, { status: 403 });
  }

  try {
    await prisma.swipe.create({
      data: { fromUserId: userId, toUserId, direction },
    });
  } catch {
    return NextResponse.json(
      { error: "Tu as déjà swipé ce profil" },
      { status: 409 }
    );
  }

  let matched = false;
  if (direction === "LIKE") {
    const reciprocal = await prisma.swipe.findUnique({
      where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: userId } },
    });
    matched = reciprocal?.direction === "LIKE";
  }

  if (matched) {
    await updateVisibilityScore(userId);
    await updateVisibilityScore(toUserId);
  }

  return NextResponse.json({ matched });
}
