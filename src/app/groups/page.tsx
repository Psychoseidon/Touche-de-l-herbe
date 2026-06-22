import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          event: { select: { title: true, location: true } },
          members: { select: { userId: true } },
        },
      },
    },
    orderBy: { group: { lastActiveAt: "desc" } },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Mes groupes</h1>

      {memberships.length === 0 && (
        <p className="text-muted-foreground">
          Tes groupes persistants apparaîtront ici après une première
          rencontre passée.
        </p>
      )}

      <div className="space-y-2">
        {memberships.map(({ group }) => (
          <Link key={group.id} href={`/groups/${group.id}`}>
            <Card className="p-4">
              <p className="font-medium">{group.event.title}</p>
              <p className="text-sm text-muted-foreground">
                {group.event.location} · {group.members.length} membres ·
                actif le {group.lastActiveAt.toLocaleDateString("fr-FR")}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
