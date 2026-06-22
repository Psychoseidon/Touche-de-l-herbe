"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EventJoinButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/join`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Erreur");
      return;
    }

    toast.success(
      data.status === "ACCEPTED"
        ? "Tu as rejoint la rencontre !"
        : "Demande envoyée, en attente de validation."
    );
    router.refresh();
  }

  return (
    <Button onClick={handleJoin} disabled={loading}>
      {loading ? "..." : "Rejoindre cette rencontre"}
    </Button>
  );
}
