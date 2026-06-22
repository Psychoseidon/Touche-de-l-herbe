import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/button';
import { ReportModal } from '@/components/report-modal';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Event, EventParticipant } from '@/lib/types';

type EventDetailResponse = {
  event: Event;
  accepted: EventParticipant[];
  pending: EventParticipant[];
  isCreator: boolean;
  myParticipation: EventParticipant | null;
  isPast: boolean;
  iAttended: boolean;
  otherParticipants: { id: string; pseudo: string }[];
  sentToIds: string[];
  matchedIds: string[];
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<EventDetailResponse | null>(null);
  const [joining, setJoining] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await apiFetch<EventDetailResponse>(`/api/events/${id}`, { token });
      setData(result);
    } catch (error) {
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!data) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.padded}>Chargement...</ThemedText>
      </ThemedView>
    );
  }

  const { event, accepted, isCreator, myParticipation, isPast, iAttended, otherParticipants, sentToIds, matchedIds } =
    data;
  const canJoin = !isCreator && !myParticipation && accepted.length < event.maxSize;

  async function handleJoin() {
    setJoining(true);
    try {
      const result = await apiFetch<{ status: string }>(`/api/events/${id}/join`, {
        method: 'POST',
        token,
      });
      Alert.alert(
        result.status === 'ACCEPTED' ? 'Tu as rejoint la rencontre !' : 'Demande envoyée'
      );
      load();
    } catch (error) {
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setJoining(false);
    }
  }

  async function sendInterest(toUserId: string) {
    setSendingTo(toUserId);
    try {
      const result = await apiFetch<{ matched: boolean }>('/api/interests', {
        method: 'POST',
        token,
        body: { toUserId, eventId: event.id, type: 'FRIENDLY' },
      });
      if (result.matched) {
        Alert.alert('C\'est réciproque !', 'Vous pouvez maintenant vous écrire.');
      }
      load();
    } catch (error) {
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setSendingTo(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">{event.title}</ThemedText>
        <ThemedText>{event.description}</ThemedText>
        <ThemedText themeColor="textSecondary">📍 {event.location}</ThemedText>
        <ThemedText themeColor="textSecondary">
          🗓️ {new Date(event.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          👥 {accepted.length}/{event.maxSize} participants · proposé par {event.creator.pseudo}
        </ThemedText>

        {canJoin && <Button label="Rejoindre cette rencontre" onPress={handleJoin} loading={joining} />}
        {myParticipation?.status === 'PENDING' && (
          <ThemedText themeColor="textSecondary">Demande en attente de validation.</ThemedText>
        )}

        {isPast && iAttended && otherParticipants.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="smallBold">
              Tu as rencontré {otherParticipants.length} personne{otherParticipants.length > 1 ? 's' : ''}.
              Signaler un intérêt ?
            </ThemedText>
            {otherParticipants.map((participant) => {
              const isMatched = matchedIds.includes(participant.id);
              const isSent = sentToIds.includes(participant.id);
              return (
                <View key={participant.id} style={styles.row}>
                  <ThemedText>{participant.pseudo}</ThemedText>
                  <View style={styles.rowActions}>
                    {isMatched ? (
                      <Button
                        label="Match ! Écrire"
                        onPress={() => router.push(`/(app)/messages/${participant.id}`)}
                      />
                    ) : (
                      <Button
                        label={isSent ? '♥' : '♡'}
                        variant="outline"
                        disabled={isSent}
                        loading={sendingTo === participant.id}
                        onPress={() => sendInterest(participant.id)}
                      />
                    )}
                    <Button
                      label="🚩"
                      variant="outline"
                      onPress={() => setReportingId(participant.id)}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {reportingId && (
        <ReportModal
          visible
          reportedId={reportingId}
          eventId={event.id}
          onClose={() => setReportingId(null)}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 48 },
  padded: { padding: 16 },
  section: { marginTop: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
