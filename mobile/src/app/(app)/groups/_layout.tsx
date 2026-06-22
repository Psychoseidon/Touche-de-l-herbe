import { Stack } from 'expo-router';

export default function GroupsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Groupes' }} />
      <Stack.Screen name="[id]" options={{ title: 'Groupe' }} />
    </Stack>
  );
}
