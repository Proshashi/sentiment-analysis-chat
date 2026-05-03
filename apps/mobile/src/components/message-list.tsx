import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { Message } from "@jingles/shared";
import { MessageBubble } from "./message-bubble";

interface Props {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: Props) {
  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  if (messages.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptyHint}>Say hi to break the ice.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reversed}
      inverted
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <MessageBubble message={item} isOwn={item.senderId === currentUserId} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 14,
    color: "#CBD5E1",
  },
});
