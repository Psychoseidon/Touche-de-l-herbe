import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TextField } from '@/components/text-field';
import { Button } from '@/components/button';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { LookingFor } from '@/lib/types';

const LOOKING_FOR_OPTIONS: { value: LookingFor; label: string }[] = [
  { value: 'FRIENDLY', label: 'Des amitiés' },
  { value: 'ROMANTIC', label: 'Une relation' },
  { value: 'BOTH', label: 'Les deux, on verra' },
];

export default function ProfileCompleteScreen() {
  const router = useRouter();
  const { token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState(['']);
  const [interests, setInterests] = useState('');
  const [lookingFor, setLookingFor] = useState<LookingFor | null>(null);

  function updatePhoto(index: number, value: string) {
    setPhotos((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addPhotoField() {
    setPhotos((prev) => (prev.length >= 4 ? prev : [...prev, '']));
  }

  async function handleSubmit() {
    if (!lookingFor) {
      Alert.alert('Présentation incomplète', 'Choisis ce que tu recherches.');
      return;
    }

    const cleanPhotos = photos.map((p) => p.trim()).filter(Boolean);
    const cleanInterests = interests
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      await apiFetch('/api/profile/complete', {
        method: 'POST',
        token,
        body: { bio, photos: cleanPhotos, interests: cleanInterests, lookingFor },
      });
      await refreshUser();
      router.back();
    } catch (error) {
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="subtitle">Complète ta présentation</ThemedText>
        <ThemedText themeColor="textSecondary">
          Pour que le swipe ait un sens, on demande à chacun de se présenter un
          minimum : quelques photos, ta bio, tes centres d&apos;intérêt et ce
          que tu recherches.
        </ThemedText>

        <TextField label="Bio" value={bio} onChangeText={setBio} multiline />

        <ThemedText type="small" themeColor="textSecondary">
          Photos (en plus de ta photo de profil)
        </ThemedText>
        {photos.map((photo, index) => (
          <TextField
            key={index}
            label={`Photo ${index + 1}`}
            placeholder="https://..."
            value={photo}
            onChangeText={(v) => updatePhoto(index, v)}
            autoCapitalize="none"
          />
        ))}
        {photos.length < 4 && (
          <Button label="+ Ajouter une photo" variant="outline" onPress={addPhotoField} />
        )}

        <TextField
          label="Centres d'intérêt (séparés par des virgules)"
          placeholder="Randonnée, cinéma, cuisine..."
          value={interests}
          onChangeText={setInterests}
        />

        <ThemedText type="small" themeColor="textSecondary">
          Tu recherches
        </ThemedText>
        <View style={styles.options}>
          {LOOKING_FOR_OPTIONS.map((option) => (
            <Button
              key={option.value}
              label={option.label}
              variant={lookingFor === option.value ? 'primary' : 'outline'}
              onPress={() => setLookingFor(option.value)}
            />
          ))}
        </View>

        <Button label="Valider ma présentation" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  options: { gap: 8 },
});
