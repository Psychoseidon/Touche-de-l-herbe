import { Redirect, Tabs } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth-context';
import { AccentColor } from '@/components/button';

export default function AppLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) return <ThemedView style={{ flex: 1 }} />;
  if (!token) return <Redirect href="/(auth)/signin" />;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: AccentColor }}>
      <Tabs.Screen name="events" options={{ title: 'Rencontres' }} />
      <Tabs.Screen name="discover" options={{ title: 'Découvrir' }} />
      <Tabs.Screen name="groups" options={{ title: 'Groupes' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="donate" options={{ title: 'Don', href: null }} />
      <Tabs.Screen name="profile-complete" options={{ title: 'Présentation', href: null }} />
      <Tabs.Screen name="profile-blog" options={{ title: 'Mon blog', href: null }} />
    </Tabs>
  );
}
