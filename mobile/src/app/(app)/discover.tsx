import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/avatar';
import { Card } from '@/components/card';
import { Button } from '@/components/button';
import { SwipeCard } from '@/components/swipe-card';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Candidate, LookingFor } from '@/lib/types';

const LOOKING_FOR_LABEL: Record<LookingFor, string> = {
  FRIENDLY: 'Cherche des amitiés',
  ROMANTIC: 'Cherche une relation',
  BOTH: 'Ouvert·e aux deux',
};

export default function DiscoverScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [matchedWith, setMatchedWith] = useState<Candidate | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ candidates: Candidate[] }>('/api/discover', { token });
      setCandidates(data.candidates);
    } catch (error) {
      if (error instanceof ApiError && error.message === 'PROFILE_INCOMPLETE') {
        router.push('/(app)/profile-complete');
        return;
      }
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    }
  }, [token, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const current = candidates?.[0];

  async function handleSwipe(direction: 'LIKE' | 'PASS') {
    if (!current || busy) return;
    setBusy(true);
    try {
      const data = await apiFetch<{ matched: boolean }>('/api/swipes', {
        method: 'POST',
        token,
        body: { toUserId: current.id, direction },
      });
      if (data.matched) setMatchedWith(current);
    } catch (error) {
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setBusy(false);
      setCandidates((prev) => (prev ?? []).slice(1));
    }
  }

  if (matchedWith) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">C&apos;est un match avec {matchedWith.pseudo} !</ThemedText>
        <ThemedText themeColor="textSecondary">
          Vous pouvez vous écrire, ou proposer directement de vous retrouver à une vraie sortie.
        </ThemedText>
        <Button
          label="Écrire"
          onPress={() => {
            const id = matchedWith.id;
            setMatchedWith(null);
            router.push(`/(app)/messages/${id}`);
          }}
        />
        <Button
          label="Proposer une sortie"
          variant="outline"
          onPress={() => {
            setMatchedWith(null);
            router.push('/(app)/events/new');
          }}
        />
        <Button label="Continuer à découvrir" variant="outline" onPress={() => setMatchedWith(null)} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {candidates === null && <ThemedText>Chargement...</ThemedText>}

      {candidates !== null && !current && (
        <ThemedText themeColor="textSecondary">
          Plus de profils à découvrir pour le moment, reviens plus tard !
        </ThemedText>
      )}

      {current && (
        <SwipeCard key={current.id} onSwiped={handleSwipe}>
          <Card style={styles.card}>
            <Avatar size={112}>
              <AvatarFallback>{current.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
              <AvatarImage uri={current.photo} />
            </Avatar>
            <ThemedText type="subtitle">
              {current.pseudo}
              {current.age !== null ? `, ${current.age}` : ''}
            </ThemedText>
            {current.lookingFor && (
              <ThemedText themeColor="textSecondary" type="small">
                {LOOKING_FOR_LABEL[current.lookingFor]}
              </ThemedText>
            )}
            {current.photos.length > 0 && (
              <View style={styles.photoRow}>
                {current.photos.map((photo, i) => (
                  <Avatar key={i} size={56}>
                    <AvatarFallback>{current.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
                    <AvatarImage uri={photo} />
                  </Avatar>
                ))}
              </View>
            )}
            {current.bio && (
              <ThemedText themeColor="textSecondary" style={styles.bio}>
                {current.bio}
              </ThemedText>
            )}
            {current.interests.length > 0 && (
              <ThemedText themeColor="textSecondary" type="small" style={styles.bio}>
                {current.interests.join(' · ')}
              </ThemedText>
            )}
          </Card>
        </SwipeCard>
      )}

      {current && (
        <View style={styles.actions}>
          <Button label="Passer" variant="outline" disabled={busy} onPress={() => handleSwipe('PASS')} />
          <Button label="J'aime" disabled={busy} onPress={() => handleSwipe('LIKE')} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, alignItems: 'center', justifyContent: 'center' },
  card: { alignItems: 'center', gap: 8, padding: 24, width: '100%' },
  bio: { textAlign: 'center' },
  photoRow: { flexDirection: 'row', gap: 8 },
  actions: { flexDirection: 'row', gap: 16 },
});
