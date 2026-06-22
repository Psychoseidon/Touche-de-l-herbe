import { Stack } from 'expo-router';

export default function EventsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Rencontres' }} />
      <Stack.Screen name="new" options={{ title: 'Créer une rencontre' }} />
      <Stack.Screen name="[id]" options={{ title: 'Détail' }} />
    </Stack>
  );
}
