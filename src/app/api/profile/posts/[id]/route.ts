import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().max(120).optional(),
  content: z.string().min(1).max(20000),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.profilePost.findUnique({ where: { id } });
  if (!post || post.authorId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Billet invalide" },
      { status: 400 }
    );
  }

  const updated = await prisma.profilePost.update({
    where: { id },
    data: { title: parsed.data.title || null, content: parsed.data.content },
  });

  return NextResponse.json({ post: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.profilePost.findUnique({ where: { id } });
  if (!post || post.authorId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.profilePost.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
