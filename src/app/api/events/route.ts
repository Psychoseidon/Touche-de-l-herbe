import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { geocodeAddress } from "@/lib/geo";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(3),
  date: z.string(),
  minSize: z.coerce.number().int().min(2),
  maxSize: z.coerce.number().int().min(2),
  radius: z.enum(["local", "national"]),
  autoAccept: z.boolean(),
  intention: z.enum(["FRIENDLY", "ROMANTIC", "BOTH"]).optional(),
});

export async function GET() {
  const events = await prisma.event.findMany({
    where: { date: { gte: new Date() } },
    include: {
      creator: { select: { id: true, pseudo: true, photo: true, visibilityScore: true } },
      participants: { where: { status: "ACCEPTED" } },
    },
    orderBy: { creator: { visibilityScore: "desc" } },
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (me?.suspended) {
    return NextResponse.json({ error: "Compte suspendu" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.minSize > data.maxSize) {
    return NextResponse.json(
      { error: "La taille minimum doit être inférieure ou égale au maximum" },
      { status: 400 }
    );
  }

  // Best-effort : si l'adresse n'est pas géolocalisable, l'événement est quand
  // même créé (sans coordonnées) plutôt que de bloquer la création.
  const coordinates = await geocodeAddress(data.location);

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      date: new Date(data.date),
      minSize: data.minSize,
      maxSize: data.maxSize,
      radius: data.radius,
      autoAccept: data.autoAccept,
      intention: data.intention,
      creatorId: userId,
      participants: {
        create: { userId, status: "ACCEPTED" },
      },
    },
  });

  return NextResponse.json({ id: event.id });
}
