import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isMatched } from "@/lib/matches";
import { getConversationId } from "@/lib/conversation";
import { ChatThread } from "@/components/chat-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { userId: otherId } = await params;
  const otherUser = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, pseudo: true, photo: true },
  });
  if (!otherUser) notFound();

  const matched = await isMatched(session.user.id, otherId);
  if (!matched) redirect("/messages");

  const conversationId = getConversationId(session.user.id, otherId);
  const messages = await prisma.message.findMany({
    where: { type: "DM", conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, pseudo: true, photo: true } } },
  });

  return (
    <ChatThread
      mode="dm"
      channelId={conversationId}
      apiBase={`/api/messages/${otherId}`}
      currentUserId={session.user.id}
      title={otherUser.pseudo}
      initialMessages={messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
      }))}
    />
  );
}
