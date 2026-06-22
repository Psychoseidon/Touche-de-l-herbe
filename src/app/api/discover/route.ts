import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/session";
import { getAge, canInteract } from "@/lib/age";
import { parsePhotos, parseInterests } from "@/lib/profile";

export async function GET(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({ where: { id: userId } });
  if (!me) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Le swipe n'a de sens que si la personne s'est elle-même présentée :
  // on l'exige avant de lui montrer des profils, et on ne montre que des
  // profils ayant fait la même démarche.
  if (!me.profileCompletedAt) {
    return NextResponse.json({ error: "PROFILE_INCOMPLETE" }, { status: 403 });
  }

  const alreadySwiped = await prisma.swipe.findMany({
    where: { fromUserId: userId },
    select: { toUserId: true },
  });

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [userId, ...alreadySwiped.map((s) => s.toUserId)] },
      verified: true,
      suspended: false,
      profileCompletedAt: { not: null },
    },
    orderBy: { visibilityScore: "desc" },
    take: 50,
    select: {
      id: true,
      pseudo: true,
      photo: true,
      photos: true,
      bio: true,
      birthDate: true,
      interests: true,
      lookingFor: true,
    },
  });

  const myAge = getAge(me.birthDate);
  const compatible = candidates
    .filter((candidate) => canInteract(myAge, getAge(candidate.birthDate)))
    .slice(0, 20)
    .map(({ id, pseudo, photo, photos, bio, birthDate, interests, lookingFor }) => ({
      id,
      pseudo,
      photo,
      photos: parsePhotos(photos),
      bio,
      age: getAge(birthDate),
      interests: parseInterests(interests),
      lookingFor,
    }));

  return NextResponse.json({ candidates: compatible });
}
