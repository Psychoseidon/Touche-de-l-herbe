import { useCallback, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/button';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { ChatMessage } from '@/lib/types';

const POLL_INTERVAL_MS = 4000;

export function ChatThread({
  apiPath,
  mode = 'dm',
}: {
  apiPath: string;
  mode?: 'dm' | 'group';
}) {
  const { token, user } = useAuth();
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ messages: ChatMessage[] }>(apiPath, { token });
      setMessages(data.messages);
    } catch {
      // silencieux : on retentera au prochain poll
    }
  }, [apiPath, token]);

  useFocusEffect(
    useCallback(() => {
      load();
      pollRef.current = setInterval(load, POLL_INTERVAL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load])
  );

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const data = await apiFetch<{ message: ChatMessage }>(apiPath, {
        method: 'POST',
        token,
        body: { content },
      });
      setMessages((prev) => [...prev, data.message]);
      setContent('');
    } catch {
      // l'utilisateur peut retenter l'envoi
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.container}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isMine = item.sender.id === user?.id;
            return (
              <View
                style={[
                  styles.bubble,
                  isMine
                    ? { alignSelf: 'flex-end', backgroundColor: '#3c87f7' }
                    : { alignSelf: 'flex-start', backgroundColor: theme.backgroundElement },
                ]}>
                {mode === 'group' && !isMine && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.sender.pseudo}
                  </ThemedText>
                )}
                <ThemedText style={isMine ? styles.mineText : undefined}>{item.content}</ThemedText>
              </View>
            );
          }}
        />
        <View style={[styles.inputRow, { borderColor: theme.backgroundSelected }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Écris un message..."
            placeholderTextColor={theme.textSecondary}
            value={content}
            onChangeText={setContent}
          />
          <Button label="Envoyer" onPress={handleSend} loading={sending} />
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  mineText: { color: '#fff' },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 8 },
});
