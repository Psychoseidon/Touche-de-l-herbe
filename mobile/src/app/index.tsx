import { Redirect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) return <ThemedView style={{ flex: 1 }} />;

  return <Redirect href={token ? '/(app)/events' : '/(auth)/signin'} />;
}
