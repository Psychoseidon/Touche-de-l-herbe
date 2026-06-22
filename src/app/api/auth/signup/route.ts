import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { name, pseudo, email, phone, password, birthDate, bio, photo } =
    parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { pseudo }, { phone }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Email, pseudo ou téléphone déjà utilisé" },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  // Liveness check (Yoti/Veriff) et confirmation SMS réelle sont V2 (hors MVP, cf. cahier des charges 10.2).
  // En MVP : email auto-confirmé, téléphone unique en base, et badge "vérifié" gagné après
  // contrôle de carte bancaire (cf. /auth/verify-card) si Stripe est configuré.
  const stripeConfigured = Boolean(getStripe());

  try {
    const user = await prisma.user.create({
      data: {
        name,
        pseudo,
        email,
        phone,
        password: hashed,
        birthDate: new Date(birthDate),
        bio,
        photo,
        emailVerifiedAt: new Date(),
        photoVerified: true,
        verified: !stripeConfigured,
      },
    });

    return NextResponse.json({ id: user.id, requiresCardCheck: stripeConfigured });
  } catch {
    return NextResponse.json(
      { error: "Email, pseudo ou téléphone déjà utilisé" },
      { status: 409 }
    );
  }
}
