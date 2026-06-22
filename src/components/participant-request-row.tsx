"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ParticipantRequestRow({
  eventId,
  participantId,
  pseudo,
}: {
  eventId: string;
  participantId: string;
  pseudo: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "ACCEPTED" | "DECLINED") {
    setLoading(true);
    const res = await fetch(
      `/api/events/${eventId}/participants/${participantId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    setLoading(false);

    if (!res.ok) {
      toast.error("Erreur");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-2">
      <span className="text-sm">{pseudo}</span>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={loading}
          onClick={() => updateStatus("ACCEPTED")}
        >
          Accepter
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => updateStatus("DECLINED")}
        >
          Refuser
        </Button>
      </div>
    </div>
  );
}
