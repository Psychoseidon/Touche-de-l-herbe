import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["REVIEWED", "DISMISSED", "ACTIONED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const me = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;
  if (!me?.isAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const report = await prisma.report.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  if (parsed.data.status === "ACTIONED") {
    await prisma.user.update({
      where: { id: report.reportedId },
      data: { suspended: true },
    });
  }

  if (parsed.data.status === "DISMISSED") {
    const stillPending = await prisma.report.count({
      where: { reportedId: report.reportedId, status: "PENDING" },
    });
    if (stillPending === 0) {
      await prisma.user.update({
        where: { id: report.reportedId },
        data: { suspended: false },
      });
    }
  }

  return NextResponse.json({ status: report.status });
}
