import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature ?? "",
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const userId = checkoutSession.metadata?.userId || null;
    const trigger = (checkoutSession.metadata?.trigger ??
      "MANUAL") as "MATCH" | "ACTIVE_GROUP" | "UNINSTALL" | "ANNIVERSARY" | "MANUAL";

    await prisma.donation.create({
      data: {
        amount: checkoutSession.amount_total ?? 0,
        trigger,
        userId: userId || undefined,
      },
    });
  }

  return NextResponse.json({ received: true });
}
