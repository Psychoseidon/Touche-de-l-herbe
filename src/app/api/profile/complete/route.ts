import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { z } from "zod";

const completeSchema = z.object({
  bio: z.string().min(10),
  photos: z.array(z.string().url()).min(1).max(4),
  interests: z.array(z.string().min(1)).min(1).max(10),
  lookingFor: z.enum(["FRIENDLY", "ROMANTIC", "BOTH"]),
});

export async function GET(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bio: true, photo: true, photos: true, interests: true, lookingFor: true, profileCompletedAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json({ profile: user });
}

export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Présentation incomplète" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  await prisma.user.update({
    where: { id: userId },
    data: {
      bio: data.bio,
      photos: JSON.stringify(data.photos),
      interests: data.interests.join(", "),
      lookingFor: data.lookingFor,
      profileCompletedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
