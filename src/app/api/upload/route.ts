import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getRequestUserId } from "@/lib/session";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Seules les images sont acceptées" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image trop lourde (8 Mo max)" },
      { status: 400 }
    );
  }

  const blob = await put(`profile-photos/${userId}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
