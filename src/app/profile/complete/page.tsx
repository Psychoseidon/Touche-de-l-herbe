"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoDropzone } from "@/components/photo-dropzone";
import { toast } from "sonner";

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={null}>
      <CompleteProfileForm />
    </Suspense>
  );
}

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/discover";

  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<string[]>([""]);
  const [interests, setInterests] = useState("");
  const [lookingFor, setLookingFor] = useState<"" | "FRIENDLY" | "ROMANTIC" | "BOTH">("");

  useEffect(() => {
    fetch("/api/profile/complete")
      .then((res) => res.json())
      .then((data) => {
        const profile = data.profile;
        if (!profile) return;
        if (profile.bio) setBio(profile.bio);
        if (profile.interests) setInterests(profile.interests);
        if (profile.lookingFor) setLookingFor(profile.lookingFor);
      });
  }, []);

  function updatePhoto(index: number, value: string) {
    setPhotos((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addPhotoField() {
    setPhotos((prev) => (prev.length >= 4 ? prev : [...prev, ""]));
  }

  function removePhotoField(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const cleanPhotos = photos.map((p) => p.trim()).filter(Boolean);
    const cleanInterests = interests
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!lookingFor) {
      toast.error("Choisis ce que tu recherches");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/profile/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio,
        photos: cleanPhotos,
        interests: cleanInterests,
        lookingFor,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Erreur lors de l'enregistrement");
      return;
    }

    toast.success("Présentation enregistrée !");
    router.push(next);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Complète ta présentation</CardTitle>
          <CardDescription>
            Pour que le swipe ait un sens, on demande à chacun de se présenter
            un minimum : quelques photos, ta bio, tes centres d&apos;intérêt et
            ce que tu recherches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                required
                minLength={10}
                maxLength={280}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Photos (en plus de ta photo de profil)</Label>
              <div className="flex flex-wrap gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="space-y-1">
                    <PhotoDropzone value={photo} onChange={(url) => updatePhoto(index, url)} />
                    {photos.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => removePhotoField(index)}
                      >
                        Retirer
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {photos.length < 4 && (
                <Button type="button" variant="outline" size="sm" onClick={addPhotoField}>
                  + Ajouter une photo
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Centres d&apos;intérêt</Label>
              <Input
                id="interests"
                required
                placeholder="Randonnée, cinéma, cuisine..."
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Séparés par des virgules</p>
            </div>

            <div className="space-y-2">
              <Label>Tu recherches</Label>
              <Select
                value={lookingFor}
                onValueChange={(v) =>
                  setLookingFor((v as typeof lookingFor) ?? "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisis une option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRIENDLY">Des amitiés</SelectItem>
                  <SelectItem value="ROMANTIC">Une relation</SelectItem>
                  <SelectItem value="BOTH">Les deux, on verra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enregistrement..." : "Valider ma présentation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
