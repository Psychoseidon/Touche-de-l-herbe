import { Redirect, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth-context';

export default function AuthLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) return <ThemedView style={{ flex: 1 }} />;
  if (token) return <Redirect href="/(app)/events" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
