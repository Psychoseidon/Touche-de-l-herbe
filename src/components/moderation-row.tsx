"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ModerationRow({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "DISMISSED" | "ACTIONED") {
    setLoading(true);
    const res = await fetch(`/api/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Erreur");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="destructive"
        disabled={loading}
        onClick={() => updateStatus("ACTIONED")}
      >
        Suspendre
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => updateStatus("DISMISSED")}
      >
        Classer sans suite
      </Button>
    </div>
  );
}
