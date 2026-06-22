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

export default function SignInScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: User }>('/api/mobile/login', {
        method: 'POST',
        body: { email, password },
      });
      await login(data.token, data.user);
    } catch (error) {
      Alert.alert('Connexion impossible', error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.title}>
          Touche de l&apos;herbe
        </ThemedText>
        <ThemedText themeColor="textSecondary">Des rencontres réelles, pas un algorithme.</ThemedText>

        <TextField
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField label="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />

        <Button label="Se connecter" onPress={handleSubmit} loading={loading} />

        <Link href="/(auth)/signup" style={styles.link}>
          <ThemedText themeColor="textSecondary">
            Pas encore de compte ? <ThemedText type="linkPrimary">Inscris-toi</ThemedText>
          </ThemedText>
        </Link>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 96, gap: 16 },
  title: { fontSize: 32, marginBottom: 4 },
  link: { marginTop: 8, alignSelf: 'center' },
});
