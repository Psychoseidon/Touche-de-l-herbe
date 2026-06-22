"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

type Post = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
};

const MARKDOWN_CLASSES =
  "[&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold " +
  "[&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "long" });
}

export function ProfileBlog({
  isOwnProfile,
  initialPosts,
}: {
  isOwnProfile: boolean;
  initialPosts: Post[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  function startCompose() {
    setComposing(true);
    setEditingId(null);
    setTitle("");
    setContent("");
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setComposing(false);
    setTitle(post.title ?? "");
    setContent(post.content);
  }

  function cancel() {
    setComposing(false);
    setEditingId(null);
  }

  async function submit() {
    if (!content.trim()) {
      toast.error("Le billet ne peut pas être vide");
      return;
    }

    setLoading(true);
    const isEdit = Boolean(editingId);
    const res = await fetch(
      isEdit ? `/api/profile/posts/${editingId}` : "/api/profile/posts",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, content }),
      }
    );
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Erreur");
      return;
    }

    if (isEdit) {
      setPosts((prev) => prev.map((p) => (p.id === editingId ? data.post : p)));
    } else {
      setPosts((prev) => [data.post, ...prev]);
    }
    toast.success(isEdit ? "Billet modifié" : "Billet publié");
    cancel();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/profile/posts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Erreur");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Billet supprimé");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Le blog</h2>
        {isOwnProfile && !composing && !editingId && (
          <Button size="sm" onClick={startCompose}>
            + Nouveau billet
          </Button>
        )}
      </div>

      {(composing || editingId) && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Input
              placeholder="Titre (optionnel)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Écris ce que tu veux — markdown supporté (titres, gras, liens, listes...)"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submit} disabled={loading}>
                {loading ? "Envoi..." : editingId ? "Enregistrer" : "Publier"}
              </Button>
              <Button size="sm" variant="outline" onClick={cancel}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 && !composing && (
        <p className="text-sm text-muted-foreground">
          {isOwnProfile
            ? "Aucun billet publié pour l'instant — exprime-toi librement, c'est ta page."
            : "Aucun billet publié pour l'instant."}
        </p>
      )}

      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              {post.title && <p className="font-semibold">{post.title}</p>}
              <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
            </div>
            {isOwnProfile && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(post)}>
                  Modifier
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(post.id)}>
                  Supprimer
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className={MARKDOWN_CLASSES}>
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
