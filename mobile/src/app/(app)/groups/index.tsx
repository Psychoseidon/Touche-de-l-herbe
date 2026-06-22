import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Group } from '@/lib/types';

export default function GroupsListScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<{ groups: Group[] }>('/api/groups', { token });
      setGroups(data.groups);
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
      {!loading && groups.length === 0 && !error && (
        <ThemedText themeColor="textSecondary" style={styles.padded}>
          Tes groupes persistants apparaîtront ici après une première rencontre passée.
        </ThemedText>
      )}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <Link href={`/(app)/groups/${item.id}`} asChild>
            <Pressable style={[styles.row, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">{item.event.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.event.location} · {item.members.length} membres
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
