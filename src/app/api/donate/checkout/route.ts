import { NextResponse } from "next/server";
import { getRequestUserId } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  amount: z.coerce.number().int().min(100).max(100000), // cents
  trigger: z.enum(["MATCH", "ACTIVE_GROUP", "UNINSTALL", "ANNIVERSARY", "MANUAL"]),
});

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Les dons ne sont pas encore configurés (STRIPE_SECRET_KEY manquant)." },
      { status: 503 }
    );
  }

  const userId = await getRequestUserId(request);
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: "Don Viens toucher de l'herbe" },
          unit_amount: parsed.data.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      trigger: parsed.data.trigger,
      userId: userId ?? "",
    },
    success_url: `${origin}/donate?success=1`,
    cancel_url: `${origin}/donate?canceled=1`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
