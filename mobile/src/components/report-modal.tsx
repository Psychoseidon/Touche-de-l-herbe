import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/button';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES = [
  { value: 'FAKE_PROFILE', label: 'Faux profil' },
  { value: 'HARASSMENT', label: 'Harcèlement' },
  { value: 'INAPPROPRIATE_BEHAVIOR', label: 'Comportement inapproprié' },
  { value: 'ILLEGAL_CONTENT', label: 'Contenu illicite' },
] as const;

export function ReportModal({
  visible,
  reportedId,
  eventId,
  onClose,
}: {
  visible: boolean;
  reportedId: string;
  eventId?: string;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  async function submit(category: string) {
    setLoading(true);
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        token,
        body: { reportedId, category, eventId },
      });
      Alert.alert('Signalement envoyé', 'Merci, notre équipe va vérifier.');
      onClose();
    } catch (error) {
      Alert.alert('Erreur', error instanceof ApiError ? error.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ThemedView style={[styles.sheet, { borderColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">Signaler ce profil</ThemedText>
            <View style={styles.options}>
              {CATEGORIES.map((category) => (
                <Button
                  key={category.value}
                  label={category.label}
                  variant="outline"
                  disabled={loading}
                  onPress={() => submit(category.value)}
                />
              ))}
            </View>
            <Button label="Annuler" onPress={onClose} disabled={loading} />
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  options: { gap: 8 },
});
