"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewEventPage() {
  return (
    <Suspense fallback={null}>
      <NewEventForm />
    </Suspense>
  );
}

function NewEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const suggestionId = searchParams.get("suggestionId");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    minSize: 2,
    maxSize: 6,
    radius: "local" as "local" | "national",
    autoAccept: true,
    intention: "" as "" | "FRIENDLY" | "ROMANTIC" | "BOTH",
  });

  const applySuggestion = useCallback(
    (suggestion: { title: string; description: string; location: string; date: string }) => {
      setForm((prev) => ({
        ...prev,
        title: suggestion.title,
        description: suggestion.description,
        location: suggestion.location,
        date: toDatetimeLocalValue(suggestion.date),
      }));
    },
    []
  );

  useEffect(() => {
    if (!suggestionId) return;
    fetch(`/api/suggested-events/${suggestionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.suggestion) applySuggestion(data.suggestion);
      });
  }, [suggestionId, applySuggestion]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        intention: form.intention || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Erreur lors de la création");
      return;
    }

    toast.success("Rencontre créée !");
    router.push(`/events/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Créer une rencontre</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description de l&apos;activité</Label>
              <Textarea
                id="description"
                required
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                required
                placeholder="Adresse ou lieu"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date et heure</Label>
              <Input
                id="date"
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSize">Taille min.</Label>
                <Input
                  id="minSize"
                  type="number"
                  min={2}
                  required
                  value={form.minSize}
                  onChange={(e) => update("minSize", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSize">Taille max.</Label>
                <Input
                  id="maxSize"
                  type="number"
                  min={2}
                  required
                  value={form.maxSize}
                  onChange={(e) => update("maxSize", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rayon de visibilité</Label>
              <Select
                value={form.radius}
                onValueChange={(v) =>
                  update("radius", (v as "local" | "national") ?? "local")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local (par défaut)</SelectItem>
                  <SelectItem value="national">National (option)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Intention (optionnelle, privée)</Label>
              <Select
                value={form.intention}
                onValueChange={(v) =>
                  update("intention", (v as typeof form.intention) ?? "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune préférence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRIENDLY">Amical</SelectItem>
                  <SelectItem value="ROMANTIC">Romantique</SelectItem>
                  <SelectItem value="BOTH">Les deux</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="autoAccept">Validation automatique des demandes</Label>
              <Switch
                id="autoAccept"
                checked={form.autoAccept}
                onCheckedChange={(checked) => update("autoAccept", checked)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Création..." : "Créer la rencontre"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
