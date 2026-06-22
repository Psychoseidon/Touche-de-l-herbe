import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { z } from "zod";

const confirmSchema = z.object({ setupIntentId: z.string() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Vérification carte non configurée" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const setupIntent = await stripe.setupIntents.retrieve(parsed.data.setupIntentId, {
    expand: ["payment_method"],
  });

  if (setupIntent.status !== "succeeded") {
    return NextResponse.json({ error: "Carte non validée" }, { status: 400 });
  }

  const paymentMethod = setupIntent.payment_method as Stripe.PaymentMethod | null;
  const fingerprint = paymentMethod?.card?.fingerprint;
  if (!fingerprint) {
    return NextResponse.json({ error: "Carte invalide" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { cardFingerprint: fingerprint, id: { not: session.user.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Cette carte est déjà associée à un autre compte" },
      { status: 409 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { cardFingerprint: fingerprint, cardVerifiedAt: new Date(), verified: true },
  });

  return NextResponse.json({ success: true });
}
