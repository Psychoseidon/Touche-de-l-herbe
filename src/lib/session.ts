import { auth } from "@/auth";
import { verifyMobileToken } from "@/lib/mobile-auth";

// Auth web (cookie de session NextAuth) et mobile (Bearer token) sur les mêmes routes API.
export async function getRequestUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const userId = await verifyMobileToken(authHeader.slice("Bearer ".length));
    if (userId) return userId;
  }

  const session = await auth();
  return session?.user?.id ?? null;
}
