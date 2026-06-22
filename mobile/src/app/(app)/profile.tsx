import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/button';
import { useAuth } from '@/lib/auth-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{user?.pseudo}</ThemedText>
      {user?.verified && <ThemedText themeColor="textSecondary">✓ Profil vérifié</ThemedText>}
      {user?.bio && <ThemedText>{user.bio}</ThemedText>}
      <Button
        label={user?.profileCompletedAt ? 'Modifier ma présentation' : 'Compléter ma présentation'}
        variant="outline"
        onPress={() => router.push('/(app)/profile-complete')}
      />
      <Button label="Mon blog" variant="outline" onPress={() => router.push('/(app)/profile-blog')} />
      <Button label="Soutenir Viens toucher de l'herbe" variant="outline" onPress={() => router.push('/(app)/donate')} />
      <Button label="Se déconnecter" variant="outline" onPress={logout} style={styles.logout} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  logout: { marginTop: 24 },
});
