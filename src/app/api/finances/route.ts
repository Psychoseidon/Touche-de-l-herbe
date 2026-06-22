import { NextResponse } from "next/server";
import { getFinancesSummary } from "@/lib/finances";

export async function GET() {
  const summary = await getFinancesSummary();
  return NextResponse.json(summary);
}
