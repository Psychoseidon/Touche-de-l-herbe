import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { ChatMessage } from '@/lib/types';

type Conversation = {
  user: { id: string; pseudo: string; photo: string | null };
  lastMessage: ChatMessage | null;
};

export default function MessagesListScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<{ conversations: Conversation[] }>('/api/messages', { token });
      setConversations(data.conversations);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ThemedView style={styles.container}>
      {error && <ThemedText style={styles.padded}>{error}</ThemedText>}
      {!loading && conversations.length === 0 && !error && (
        <ThemedText themeColor="textSecondary" style={styles.padded}>
          Pas encore de match. Signale un intérêt après une rencontre pour débloquer une
          conversation en cas de réciprocité.
        </ThemedText>
      )}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <Link href={`/(app)/messages/${item.user.id}`} asChild>
            <Pressable style={[styles.row, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">{item.user.pseudo}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {item.lastMessage?.content ?? 'Dites bonjour !'}
              </ThemedText>
            </Pressable>
          </Link>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  padded: { padding: 16 },
  list: { paddingHorizontal: 16, gap: 8, paddingTop: 16, paddingBottom: 32 },
  row: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
});
