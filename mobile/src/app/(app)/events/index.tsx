import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/button';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, ApiError } from '@/lib/api';
import type { Event } from '@/lib/types';

export default function EventsListScreen() {
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<{ events: Event[] }>('/api/events');
      setEvents(data.events);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Link href="/(app)/events/new" asChild>
          <Button label="Créer une rencontre" />
        </Link>
      </View>

      {error && (
        <ThemedText themeColor="textSecondary" style={styles.padded}>
          {error}
        </ThemedText>
      )}

      {!loading && events.length === 0 && !error && (
        <ThemedText themeColor="textSecondary" style={styles.padded}>
          Aucune rencontre pour le moment. Sois le premier à en proposer une !
        </ThemedText>
      )}

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <Link href={`/(app)/events/${item.id}`} asChild>
            <Pressable style={[styles.card, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                📍 {item.location}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                🗓️ {new Date(item.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                👥 {item.participants.length}/{item.maxSize} · proposé par {item.creator.pseudo}
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
  header: { padding: 16 },
  padded: { paddingHorizontal: 16, paddingBottom: 16 },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 32 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
});
