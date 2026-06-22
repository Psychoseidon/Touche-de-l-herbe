"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function StartCta({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);

  const swipeHref = isAuthenticated ? "/discover" : "/auth/signup";
  const eventsHref = isAuthenticated ? "/events" : "/auth/signup";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <Button size="lg" onClick={() => setOpen((v) => !v)}>
        Faire de nouvelles rencontres
      </Button>

      {open && (
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Link href={swipeHref}>
            <Card className="h-full transition hover:shadow-md hover:border-primary">
              <CardHeader>
                <CardTitle>Swipe en tête-à-tête</CardTitle>
                <CardDescription>
                  Découvre des profils un par un. Un match mutuel débloque le
                  chat et te propose de vous retrouver à une vraie sortie.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href={eventsHref}>
            <Card className="h-full transition hover:shadow-md hover:border-primary">
              <CardHeader>
                <CardTitle>Rencontres de groupe</CardTitle>
                <CardDescription>
                  Rejoins ou propose une sortie réelle avec plusieurs
                  personnes — pas de match préalable, juste l&apos;envie de
                  se retrouver.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Crée un compte pour commencer — c&apos;est gratuit.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
