import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatThread } from "@/components/chat-thread";
import { Button } from "@/components/ui/button";
import { daysSince } from "@/lib/dates";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      event: { select: { title: true, location: true, createdAt: true } },
      members: { include: { user: { select: { id: true, pseudo: true } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, pseudo: true, photo: true } } },
      },
    },
  });
  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === session.user.id);
  if (!isMember) redirect("/groups");

  const daysSinceActive = daysSince(group.lastActiveAt);
  const daysSinceCreated = daysSince(group.createdAt);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{group.event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {group.members.length} membres · {group.event.location}
          </p>
        </div>
        <Link href="/events/new">
          <Button variant="outline" size="sm">
            Proposer une re-sortie
          </Button>
        </Link>
      </div>

      {daysSinceActive >= 21 && (
        <p className="mb-4 rounded-md border bg-muted/50 p-3 text-sm">
          Ça fait un moment ! Quelqu&apos;un veut proposer une sortie ?
        </p>
      )}

      {daysSinceCreated >= 30 && (
        <p className="mb-4 rounded-md border bg-muted/50 p-3 text-sm">
          Votre groupe se retrouve régulièrement.{" "}
          <Link href="/donate" className="underline">
            Aidez-nous à continuer ?
          </Link>
        </p>
      )}

      <ChatThread
        mode="group"
        channelId={group.id}
        apiBase={`/api/groups/${group.id}/messages`}
        currentUserId={session.user.id}
        title="Discussion de groupe"
        initialMessages={group.messages.map((m) => ({
          id: m.id,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          sender: m.sender,
        }))}
      />
    </div>
  );
}
