import { NextResponse } from "next/server";
import { syncSuggestedEvents } from "@/lib/sync-suggested-events";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await syncSuggestedEvents();
  return NextResponse.json({ synced: count });
}
