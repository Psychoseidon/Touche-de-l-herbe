"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const LOOKING_FOR_LABEL: Record<string, string> = {
  FRIENDLY: "Cherche des amitiés",
  ROMANTIC: "Cherche une relation",
  BOTH: "Ouvert·e aux deux",
};

type Candidate = {
  id: string;
  pseudo: string;
  photo: string | null;
  photos: string[];
  bio: string | null;
  age: number | null;
  interests: string[];
  lookingFor: string | null;
};

export default function DiscoverPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchedWith, setMatchedWith] = useState<Candidate | null>(null);

  useEffect(() => {
    fetch("/api/discover")
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 403 && data.error === "PROFILE_INCOMPLETE") {
          toast("Complète ta présentation pour activer le swipe.");
          router.push("/profile/complete?next=/discover");
          return;
        }
        setCandidates(data.candidates ?? []);
      });
  }, [router]);

  const current = candidates?.[0];

  async function swipe(direction: "LIKE" | "PASS") {
    if (!current || loading) return;
    setLoading(true);

    const res = await fetch("/api/swipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: current.id, direction }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Erreur");
      return;
    }

    if (data.matched) {
      setMatchedWith(current);
    } else if (direction === "LIKE") {
      toast("J'aime envoyé, discrètement.");
    }

    setCandidates((prev) => (prev ?? []).slice(1));
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Découvrir</h1>

      {candidates === null && (
        <p className="text-muted-foreground">Chargement...</p>
      )}

      {candidates !== null && !current && (
        <p className="text-muted-foreground">
          Plus de profils à découvrir pour le moment, reviens plus tard !
        </p>
      )}

      {current && (
        <Card>
          <CardHeader className="flex flex-col items-center gap-3">
            <Avatar className="h-28 w-28">
              <AvatarImage src={current.photo ?? undefined} alt={current.pseudo} />
              <AvatarFallback>{current.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle>
              {current.pseudo}
              {current.age !== null && `, ${current.age}`}
            </CardTitle>
            {current.lookingFor && (
              <Badge variant="secondary">{LOOKING_FOR_LABEL[current.lookingFor]}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {current.photos.length > 0 && (
              <div className="flex justify-center gap-2">
                {current.photos.map((photo, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={photo}
                    alt={`${current.pseudo} ${i + 2}`}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                ))}
              </div>
            )}
            {current.bio && (
              <p className="text-center text-muted-foreground">{current.bio}</p>
            )}
            {current.interests.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {current.interests.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                disabled={loading}
                onClick={() => swipe("PASS")}
              >
                Passer
              </Button>
              <Button size="lg" disabled={loading} onClick={() => swipe("LIKE")}>
                J&apos;aime
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {matchedWith && (
        <Card className="mt-6 border-primary">
          <CardHeader>
            <CardTitle>C&apos;est un match avec {matchedWith.pseudo} !</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted-foreground">
              Vous pouvez maintenant vous écrire, ou directement proposer de
              vous retrouver à une vraie sortie.
            </p>
            <div className="flex gap-3">
              <Link href={`/messages/${matchedWith.id}`}>
                <Button>Écrire</Button>
              </Link>
              <Link href="/events/new">
                <Button variant="outline">Proposer une sortie</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
