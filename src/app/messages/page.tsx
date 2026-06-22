import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAllMatchedUserIds } from "@/lib/matches";
import { getConversationId } from "@/lib/conversation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const matchedIds = await getAllMatchedUserIds(session.user.id);
  const matches = await prisma.user.findMany({
    where: { id: { in: Array.from(matchedIds) } },
    select: { id: true, pseudo: true, photo: true },
  });

  const conversations = await Promise.all(
    matches.map(async (user) => {
      const conversationId = getConversationId(session.user.id, user.id);
      const lastMessage = await prisma.message.findFirst({
        where: { type: "DM", conversationId },
        orderBy: { createdAt: "desc" },
      });
      return { user, lastMessage };
    })
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Messages</h1>

      {conversations.length === 0 && (
        <p className="text-muted-foreground">
          Pas encore de match. Signale un intérêt après une rencontre pour
          débloquer une conversation en cas de réciprocité.
        </p>
      )}

      <div className="space-y-2">
        {conversations.map(({ user, lastMessage }) => (
          <Link key={user.id} href={`/messages/${user.id}`}>
            <Card className="flex flex-row items-center gap-3 p-3">
              <Avatar>
                <AvatarImage src={user.photo ?? undefined} />
                <AvatarFallback>
                  {user.pseudo.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{user.pseudo}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {lastMessage?.content ?? "Dites bonjour !"}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
