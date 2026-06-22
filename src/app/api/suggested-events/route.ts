import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suggestions = await prisma.suggestedEvent.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 12,
  });

  return NextResponse.json({ suggestions });
}
