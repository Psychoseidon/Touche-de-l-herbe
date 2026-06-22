import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TextField } from '@/components/text-field';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { ProfilePost } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'long' });
}

export default function ProfileBlogScreen() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<ProfilePost[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ posts: ProfilePost[] }>('/api/profile/posts', { token });
      setPosts(data.posts);
    } catch (error) {
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function startCompose() {
    setComposing(true);
    setEditingId(null);
    setTitle('');
    setContent('');
  }

  function startEdit(post: ProfilePost) {
    setEditingId(post.id);
    setComposing(false);
    setTitle(post.title ?? '');
    setContent(post.content);
  }

  function cancel() {
    setComposing(false);
    setEditingId(null);
  }

  async function submit() {
    if (!content.trim()) {
      Alert.alert('Billet vide', 'Écris quelque chose avant de publier.');
      return;
    }

    setLoading(true);
    try {
      const isEdit = Boolean(editingId);
      const data = await apiFetch<{ post: ProfilePost }>(
        isEdit ? `/api/profile/posts/${editingId}` : '/api/profile/posts',
        {
          method: isEdit ? 'PATCH' : 'POST',
          token,
          body: { title: title.trim() || undefined, content },
        }
      );
      setPosts((prev) => {
        const list = prev ?? [];
        return isEdit
          ? list.map((p) => (p.id === editingId ? data.post : p))
          : [data.post, ...list];
      });
      cancel();
    } catch (error) {
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(id: string) {
    Alert.alert('Supprimer ce billet ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/profile/posts/${id}`, { method: 'DELETE', token });
            setPosts((prev) => (prev ?? []).filter((p) => p.id !== id));
          } catch (error) {
            Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
          }
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="subtitle">Mon blog</ThemedText>
        <ThemedText themeColor="textSecondary">
          C&apos;est ta page : écris ce que tu veux, aussi souvent que tu veux.
        </ThemedText>

        {!composing && !editingId && (
          <Button label="+ Nouveau billet" onPress={startCompose} />
        )}

        {(composing || editingId) && (
          <Card style={styles.card}>
            <TextField label="Titre (optionnel)" value={title} onChangeText={setTitle} />
            <TextField
              label="Contenu"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
            />
            <View style={styles.row}>
              <Button
                label={loading ? 'Envoi...' : editingId ? 'Enregistrer' : 'Publier'}
                onPress={submit}
                loading={loading}
              />
              <Button label="Annuler" variant="outline" onPress={cancel} />
            </View>
          </Card>
        )}

        {posts === null && <ThemedText themeColor="textSecondary">Chargement...</ThemedText>}

        {posts?.length === 0 && !composing && (
          <ThemedText themeColor="textSecondary">
            Aucun billet publié pour l&apos;instant.
          </ThemedText>
        )}

        {posts?.map((post) => (
          <Card key={post.id} style={styles.card}>
            {post.title && <ThemedText type="smallBold">{post.title}</ThemedText>}
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(post.createdAt)}
            </ThemedText>
            <ThemedText>{post.content}</ThemedText>
            <View style={styles.row}>
              <Button label="Modifier" variant="outline" onPress={() => startEdit(post)} />
              <Button label="Supprimer" variant="outline" onPress={() => confirmDelete(post.id)} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  card: { gap: 10, padding: 16 },
  row: { flexDirection: 'row', gap: 12 },
});
