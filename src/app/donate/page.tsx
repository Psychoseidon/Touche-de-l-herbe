"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

const AMOUNTS = [300, 500, 1000, 2000];

export default function DonatePage() {
  const [loading, setLoading] = useState(false);

  async function donate(amountCents: number) {
    setLoading(true);
    const res = await fetch("/api/donate/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountCents, trigger: "MANUAL" }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Erreur");
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Soutenir Touche de l&apos;herbe</CardTitle>
          <CardDescription>
            Pas de premium, pas d&apos;abonnement. L&apos;app est gratuite et
            équitable — si elle t&apos;a apporté quelque chose, un café
            offert ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                disabled={loading}
                onClick={() => donate(amount)}
              >
                {(amount / 100).toFixed(2)} €
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Transparence financière complète sur{" "}
            <a href="/finances" className="underline">
              /finances
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
