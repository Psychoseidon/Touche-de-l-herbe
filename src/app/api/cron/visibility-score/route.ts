import { NextResponse } from "next/server";
import { recomputeAllVisibilityScores } from "@/lib/fair-queue";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await recomputeAllVisibilityScores();
  return NextResponse.json({ updated: count });
}
