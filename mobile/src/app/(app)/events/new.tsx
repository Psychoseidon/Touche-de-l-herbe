import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TextField } from '@/components/text-field';
import { Button } from '@/components/button';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function NewEventScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    minSize: '2',
    maxSize: '6',
  });

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const data = await apiFetch<{ id: string }>('/api/events', {
        method: 'POST',
        token,
        body: {
          title: form.title,
          description: form.description,
          location: form.location,
          date: new Date(form.date).toISOString(),
          minSize: Number(form.minSize),
          maxSize: Number(form.maxSize),
          radius: 'local',
          autoAccept: true,
        },
      });
      router.replace(`/(app)/events/${data.id}`);
    } catch (error) {
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Titre" value={form.title} onChangeText={(v) => update('title', v)} />
        <TextField
          label="Description de l'activité"
          value={form.description}
          onChangeText={(v) => update('description', v)}
          multiline
        />
        <TextField label="Lieu" value={form.location} onChangeText={(v) => update('location', v)} />
        <TextField
          label="Date et heure (AAAA-MM-JJ HH:mm)"
          placeholder="2026-07-12 18:00"
          value={form.date}
          onChangeText={(v) => update('date', v)}
        />
        <TextField
          label="Taille min."
          keyboardType="number-pad"
          value={form.minSize}
          onChangeText={(v) => update('minSize', v)}
        />
        <TextField
          label="Taille max."
          keyboardType="number-pad"
          value={form.maxSize}
          onChangeText={(v) => update('maxSize', v)}
        />
        <Button label="Créer la rencontre" onPress={handleSubmit} loading={loading} />
        <ThemedText type="small" themeColor="textSecondary">
          Rayon local et validation automatique par défaut — modifiable sur le site web.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
});
