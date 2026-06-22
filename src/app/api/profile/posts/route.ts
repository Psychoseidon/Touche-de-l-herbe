import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().max(120).optional(),
  content: z.string().min(1).max(20000),
});

export async function GET(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const posts = await prisma.profilePost.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (me?.suspended) {
    return NextResponse.json({ error: "Compte suspendu" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Billet invalide" },
      { status: 400 }
    );
  }

  const post = await prisma.profilePost.create({
    data: {
      title: parsed.data.title || null,
      content: parsed.data.content,
      authorId: userId,
    },
  });

  return NextResponse.json({ post });
}
