import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/button';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const AMOUNTS = [300, 500, 1000, 2000];

export default function DonateScreen() {
  const { token } = useAuth();
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);
  const [summary, setSummary] = useState<{ totalCents: number; donationCount: number } | null>(
    null
  );

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiFetch<{ totalCents: number; donationCount: number }>(
        '/api/finances'
      );
      setSummary(data);
    } catch {
      // page reste utilisable sans le résumé
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  async function donate(amountCents: number) {
    setLoadingAmount(amountCents);
    try {
      const data = await apiFetch<{ url: string }>('/api/donate/checkout', {
        method: 'POST',
        token,
        body: { amount: amountCents, trigger: 'MANUAL' },
      });
      await WebBrowser.openBrowserAsync(data.url);
    } catch (error) {
      Alert.alert('Don indisponible', error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setLoadingAmount(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Soutenir Viens toucher de l&apos;herbe</ThemedText>
      <ThemedText themeColor="textSecondary">
        Pas de premium, pas d&apos;abonnement. Si l&apos;app t&apos;a apporté quelque chose, un
        café offert ?
      </ThemedText>

      <View style={styles.grid}>
        {AMOUNTS.map((amount) => (
          <Button
            key={amount}
            label={`${(amount / 100).toFixed(2)} €`}
            variant="outline"
            loading={loadingAmount === amount}
            onPress={() => donate(amount)}
          />
        ))}
      </View>

      {summary && (
        <ThemedText type="small" themeColor="textSecondary">
          {(summary.totalCents / 100).toFixed(2)} € reçus au total · {summary.donationCount} don
          {summary.donationCount > 1 ? 's' : ''}.
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
