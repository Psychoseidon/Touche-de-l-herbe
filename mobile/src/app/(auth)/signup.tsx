import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TextField } from '@/components/text-field';
import { Button } from '@/components/button';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/lib/types';

export default function SignUpScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    pseudo: '',
    email: '',
    phone: '',
    password: '',
    birthDate: '',
    bio: '',
    photo: '',
  });

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const signupData = await apiFetch<{ id: string; requiresCardCheck: boolean }>(
        '/api/auth/signup',
        { method: 'POST', body: form }
      );

      const loginData = await apiFetch<{ token: string; user: User }>('/api/mobile/login', {
        method: 'POST',
        body: { email: form.email, password: form.password },
      });

      await login(loginData.token, loginData.user);

      if (signupData.requiresCardCheck) {
        Alert.alert(
          'Vérification carte',
          "Pour confirmer ton profil, finalise la vérification carte bancaire (sans débit) depuis le site web."
        );
      }
    } catch (error) {
      Alert.alert("Inscription impossible", error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="subtitle">Créer un compte</ThemedText>
        <ThemedText themeColor="textSecondary">
          Vérification identité requise (photo + âge 18+).
        </ThemedText>

        <TextField label="Nom" value={form.name} onChangeText={(v) => update('name', v)} />
        <TextField label="Pseudo public" value={form.pseudo} onChangeText={(v) => update('pseudo', v)} />
        <TextField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(v) => update('email', v)}
        />
        <TextField
          label="Téléphone"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => update('phone', v)}
        />
        <TextField
          label="Date de naissance (AAAA-MM-JJ)"
          placeholder="1995-06-15"
          value={form.birthDate}
          onChangeText={(v) => update('birthDate', v)}
        />
        <TextField
          label="Photo de profil (URL)"
          autoCapitalize="none"
          placeholder="https://..."
          value={form.photo}
          onChangeText={(v) => update('photo', v)}
        />
        <TextField label="Bio courte" value={form.bio} onChangeText={(v) => update('bio', v)} />
        <TextField
          label="Mot de passe"
          secureTextEntry
          value={form.password}
          onChangeText={(v) => update('password', v)}
        />

        <Button label="Créer mon compte" onPress={handleSubmit} loading={loading} />

        <Link href="/(auth)/signin" style={styles.link}>
          <ThemedText themeColor="textSecondary">
            Déjà un compte ? <ThemedText type="linkPrimary">Connecte-toi</ThemedText>
          </ThemedText>
        </Link>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 64, gap: 14, paddingBottom: 48 },
  link: { marginTop: 8, alignSelf: 'center' },
});
