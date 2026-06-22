import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ChatThread } from '@/components/chat-thread';
import { ReportModal } from '@/components/report-modal';
import { Button } from '@/components/button';

export default function ConversationScreen() {
  const { userId: otherId } = useLocalSearchParams<{ userId: string }>();
  const [reporting, setReporting] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button label="🚩" variant="outline" onPress={() => setReporting(true)} />
          ),
        }}
      />
      <ChatThread mode="dm" apiPath={`/api/messages/${otherId}`} />
      <ReportModal visible={reporting} reportedId={otherId} onClose={() => setReporting(false)} />
    </>
  );
}
