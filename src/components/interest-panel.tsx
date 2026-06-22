"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Participant = {
  id: string;
  pseudo: string;
};

export function InterestPanel({
  eventId,
  participants,
  sentToIds,
  matchedIds,
}: {
  eventId: string;
  participants: Participant[];
  sentToIds: string[];
  matchedIds: string[];
}) {
  const router = useRouter();
  const [sent, setSent] = useState(new Set(sentToIds));
  const [types, setTypes] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const matched = new Set(matchedIds);

  async function sendInterest(toUserId: string) {
    setLoadingId(toUserId);
    const res = await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUserId,
        eventId,
        type: types[toUserId] ?? "FRIENDLY",
      }),
    });
    const data = await res.json();
    setLoadingId(null);

    if (!res.ok) {
      toast.error(data.error ?? "Erreur");
      return;
    }

    setSent((prev) => new Set(prev).add(toUserId));

    if (data.matched) {
      toast.success(
        "C'est réciproque ! Vous pouvez maintenant vous écrire."
      );
      router.refresh();
    } else {
      toast("Signal envoyé, discrètement.");
    }
  }

  if (participants.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        Tu as rencontré {participants.length} personne
        {participants.length > 1 ? "s" : ""} lors de cette sortie. Souhaites-tu
        signaler un intérêt pour l&apos;une d&apos;elles ?
      </p>
      <div className="space-y-2">
        {participants.map((p) => {
          const isSent = sent.has(p.id);
          const isMatched = matched.has(p.id);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-md border p-2"
            >
              <span className="text-sm">{p.pseudo}</span>
              {isMatched ? (
                <Link href={`/messages/${p.id}`}>
                  <Button size="sm" variant="secondary">
                    Match ! Écrire
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Select
                    value={types[p.id] ?? "FRIENDLY"}
                    onValueChange={(v) =>
                      setTypes((prev) => ({ ...prev, [p.id]: v ?? "FRIENDLY" }))
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRIENDLY">Amical</SelectItem>
                      <SelectItem value="ROMANTIC">Romantique</SelectItem>
                      <SelectItem value="BOTH">Les deux</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant={isSent ? "secondary" : "outline"}
                    disabled={isSent || loadingId === p.id}
                    onClick={() => sendInterest(p.id)}
                  >
                    {isSent ? "♥" : "♡"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
