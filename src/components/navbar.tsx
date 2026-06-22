import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Touche de l&apos;herbe
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/events">Rencontres</Link>
          {session?.user && (
            <>
              <Link href="/discover">Découvrir</Link>
              <Link href="/groups">Groupes</Link>
              <Link href="/messages">Messages</Link>
              <Link href={`/profile/${session.user.id}`}>Mon profil</Link>
            </>
          )}
          <Link href="/finances">Finances</Link>
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Se déconnecter
              </Button>
            </form>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">S&apos;inscrire</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
