"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function CardVerificationForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const setupRes = await fetch("/api/card-verification/setup-intent", {
      method: "POST",
    });
    const setupData = await setupRes.json();
    if (!setupRes.ok) {
      toast.error(setupData.error ?? "Erreur");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setLoading(false);
      return;
    }

    const result = await stripe.confirmCardSetup(setupData.clientSecret, {
      payment_method: { card: cardElement },
    });

    if (result.error) {
      toast.error(result.error.message ?? "Carte refusée");
      setLoading(false);
      return;
    }

    const confirmRes = await fetch("/api/card-verification/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupIntentId: result.setupIntent.id }),
    });
    const confirmData = await confirmRes.json();
    setLoading(false);

    if (!confirmRes.ok) {
      toast.error(confirmData.error ?? "Erreur lors de la vérification");
      return;
    }

    toast.success("Carte vérifiée, ton profil est confirmé !");
    router.push("/events");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border p-3">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? "Vérification..." : "Vérifier ma carte"}
      </Button>
    </form>
  );
}

export default function VerifyCardPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Vérification anti-fraude</CardTitle>
          <CardDescription>
            Aucun montant n&apos;est débité. On vérifie juste qu&apos;une carte
            valide existe, pour limiter les comptes multiples et les faux
            profils mineurs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <CardVerificationForm />
            </Elements>
          ) : (
            <p className="text-sm text-muted-foreground">
              Cette vérification n&apos;est pas encore configurée sur cette
              instance.{" "}
              <Link href="/events" className="underline">
                Continuer sans vérifier →
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
