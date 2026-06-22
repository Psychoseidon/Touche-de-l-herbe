"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { getPusherClient } from "@/lib/pusher-client";

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; pseudo: string; photo: string | null };
};

export function ChatThread({
  mode,
  channelId,
  apiBase,
  currentUserId,
  title,
  initialMessages,
}: {
  mode: "dm" | "group";
  channelId: string;
  apiBase: string;
  currentUserId: string;
  title: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelPrefix = mode === "dm" ? "conversation" : "group";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const pusher = getPusherClient();

    if (pusher) {
      const channel = pusher.subscribe(`${channelPrefix}-${channelId}`);
      channel.bind("new-message", (message: ChatMessage) => {
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message]
        );
      });
      return () => {
        pusher.unsubscribe(`${channelPrefix}-${channelId}`);
      };
    }

    const interval = setInterval(async () => {
      const res = await fetch(apiBase);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
    }, 4000);
    return () => clearInterval(interval);
  }, [apiBase, channelId, channelPrefix]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSending(true);

    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSending(false);

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) =>
        prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
      );
      setContent("");
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">{title}</h1>
      <Card className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((message) => {
          const isMine = message.sender.id === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
            >
              {!isMine && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={message.sender.photo ?? undefined} />
                  <AvatarFallback>
                    {message.sender.pseudo.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                  isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {mode === "group" && !isMine && (
                  <p className="mb-1 text-xs font-medium opacity-70">
                    {message.sender.pseudo}
                  </p>
                )}
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </Card>
      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écris un message..."
        />
        <Button type="submit" disabled={sending}>
          Envoyer
        </Button>
      </form>
    </div>
  );
}
