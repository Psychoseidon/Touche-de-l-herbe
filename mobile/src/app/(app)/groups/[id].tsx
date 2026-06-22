import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/button';
import { ChatThread } from '@/components/chat-thread';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { daysSince } from '@/lib/dates';
import type { Group } from '@/lib/types';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ group: Group }>(`/api/groups/${id}`, { token });
      setGroup(data.group);
    } catch {
      // l'utilisateur verra l'écran vide, le chat reste joignable
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!group) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.padded}>Chargement...</ThemedText>
      </ThemedView>
    );
  }

  const daysSinceActive = daysSince(group.lastActiveAt);
  const daysSinceCreated = daysSince(group.createdAt);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="smallBold">{group.event.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {group.members.length} membres · {group.event.location}
        </ThemedText>
        <Button
          label="Proposer une re-sortie"
          variant="outline"
          onPress={() => router.push('/(app)/events/new')}
        />
        {daysSinceActive >= 21 && (
          <ThemedText type="small" themeColor="textSecondary">
            Ça fait un moment ! Quelqu&apos;un veut proposer une sortie ?
          </ThemedText>
        )}
        {daysSinceCreated >= 30 && (
          <Button
            label="Soutenir Touche de l'herbe"
            variant="outline"
            onPress={() => router.push('/(app)/donate')}
          />
        )}
      </ThemedView>
      <ChatThread mode="group" apiPath={`/api/groups/${group.id}/messages`} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  padded: { padding: 16 },
  header: { padding: 16, gap: 8 },
});
