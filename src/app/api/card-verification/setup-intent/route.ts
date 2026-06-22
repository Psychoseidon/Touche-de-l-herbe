import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Vérification carte non configurée (STRIPE_SECRET_KEY manquant)." },
      { status: 503 }
    );
  }

  // SetupIntent : ne débite jamais la carte, ne sert qu'à valider qu'elle existe
  // et à récupérer son empreinte (anti-multicompte).
  const setupIntent = await stripe.setupIntents.create({
    payment_method_types: ["card"],
  });

  return NextResponse.json({ clientSecret: setupIntent.client_secret });
}
