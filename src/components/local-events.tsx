"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { withDistance } from "@/lib/geo";
import { matchingInterests } from "@/lib/profile";

type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  latitude: number | null;
  longitude: number | null;
  maxSize: number;
  radius: string;
  creator: { pseudo: string };
  participants: { id: string }[];
};

type Suggestion = {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
  tags?: string | null;
};

const DEFAULT_RADIUS_KM = 25;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function LocalEvents({
  events,
  suggestions,
  myInterests,
}: {
  events: EventItem[];
  suggestions: Suggestion[];
  myInterests: string[];
}) {
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "granted" | "denied"
  >("idle");
  const [filterByInterest, setFilterByInterest] = useState(myInterests.length > 0);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 8000 }
    );
  }

  const eventsWithDistance = useMemo(
    () => withDistance(events, coords, radiusKm),
    [events, coords, radiusKm]
  );

  const suggestionsInRadius = useMemo(
    () => withDistance(suggestions, coords, radiusKm),
    [suggestions, coords, radiusKm]
  );

  const suggestionsWithMatch = useMemo(
    () =>
      suggestionsInRadius.map(({ item, distanceKm }) => ({
        item,
        distanceKm,
        matched: matchingInterests(
          `${item.title} ${item.description} ${item.tags ?? ""}`,
          myInterests
        ),
      })),
    [suggestionsInRadius, myInterests]
  );

  const hasAnyMatch = suggestionsWithMatch.some(({ matched }) => matched.length > 0);
  const displayedSuggestions =
    filterByInterest && hasAnyMatch
      ? suggestionsWithMatch.filter(({ matched }) => matched.length > 0)
      : suggestionsWithMatch;

  if (locationStatus !== "granted") {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="max-w-md text-muted-foreground">
          {locationStatus === "denied"
            ? "Position indisponible — autorise la localisation dans ton navigateur pour voir les sorties et idées près de toi."
            : "Active ta position pour voir les sorties et idées de sorties près de chez toi."}
        </p>
        <Button variant="outline" onClick={requestLocation} disabled={locationStatus === "loading"}>
          {locationStatus === "loading" ? "Localisation..." : "Activer ma position"}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-full max-w-sm space-y-2">
          <p className="text-sm text-muted-foreground">Rayon : {radiusKm} km</p>
          <Slider
            value={[radiusKm]}
            min={5}
            max={200}
            step={5}
            onValueChange={(value) => setRadiusKm(Array.isArray(value) ? value[0] : value)}
          />
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold">Sorties autour de chez toi</h2>

        {eventsWithDistance.length === 0 && (
          <p className="text-center text-muted-foreground">
            Aucune sortie dans ce rayon pour le moment.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventsWithDistance.map(({ item: event, distanceKm }) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="h-full transition hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    <Badge variant={event.radius === "national" ? "default" : "secondary"}>
                      {distanceKm !== null ? `${distanceKm.toFixed(0)} km` : event.radius}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p className="line-clamp-2">{event.description}</p>
                  <p>📍 {event.location}</p>
                  <p>🗓️ {formatDate(event.date)}</p>
                  <p>
                    👥 {event.participants.length}/{event.maxSize} · proposé par{" "}
                    {event.creator.pseudo}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-semibold">Idées de sorties autour de toi</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Concerts, expositions, compétitions, sport, cosplay... sélectionnées
              chaque jour parmi les événements publics près de toi. Adopte une
              idée pour en faire une vraie rencontre Viens toucher de l&apos;herbe.
            </p>
            {myInterests.length > 0 && (
              <div className="flex items-center gap-2">
                <Switch
                  id="filter-interests"
                  checked={filterByInterest}
                  onCheckedChange={setFilterByInterest}
                />
                <Label htmlFor="filter-interests" className="text-sm">
                  Selon mes centres d&apos;intérêt
                </Label>
              </div>
            )}
          </div>

          {displayedSuggestions.length === 0 && (
            <p className="text-center text-muted-foreground">
              Aucune idée de sortie dans ce rayon pour le moment.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedSuggestions.map(({ item: suggestion, distanceKm, matched }) => (
              <Card key={suggestion.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    <Badge variant="secondary">
                      {distanceKm !== null ? `${distanceKm.toFixed(0)} km` : "Idée de sortie"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
                  <div className="space-y-1">
                    <p className="line-clamp-2">{suggestion.description}</p>
                    <p>📍 {suggestion.location}</p>
                    <p>🗓️ {formatDate(suggestion.date)}</p>
                  </div>
                  {suggestion.tags && (
                    <div className="flex flex-wrap gap-1">
                      {suggestion.tags
                        .split(";")
                        .filter(Boolean)
                        .map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}
                  {matched.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {matched.map((tag) => (
                        <Badge key={tag} variant="outline">
                          ✓ {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      href={`/events/new?suggestionId=${suggestion.id}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Organiser ça avec mon groupe
                    </Link>
                    <a
                      href={suggestion.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      Voir la source
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
