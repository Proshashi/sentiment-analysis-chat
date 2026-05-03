import { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { MessageInput } from "../src/components/message-input";
import { MessageList } from "../src/components/message-list";
import {
  MessagesProvider,
  useMessages,
} from "../src/lib/messages-context";
import { useUser } from "../src/lib/user-context";
import { useConversationSocket } from "../src/lib/use-conversation-socket";

const CONVERSATION_ID = "conv-1";

export default function ConversationScreen() {
  const { currentUser } = useUser();

  useEffect(() => {
    if (!currentUser) router.replace("/");
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <MessagesProvider>
      <ConversationContent />
    </MessagesProvider>
  );
}

function ConversationContent() {
  const { currentUser, otherUser } = useUser();
  const { messages } = useMessages();
  const { send, error } = useConversationSocket({
    conversationId: CONVERSATION_ID,
    userId: currentUser?.id ?? "",
  });

  if (!currentUser || !otherUser) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace("/")}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.5 }]}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <View
            style={[styles.avatar, { backgroundColor: otherUser.avatarColor }]}
          >
            <Text style={styles.avatarText}>{otherUser.name[0]}</Text>
          </View>
          <Text style={styles.headerName}>{otherUser.name}</Text>
        </View>
        <View style={styles.back} />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Connection problem: {error}</Text>
        </View>
      ) : null}

      <View style={styles.messages}>
        <MessageList messages={messages} currentUserId={currentUser.id} />
      </View>

      <MessageInput onSend={send} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  back: {
    minWidth: 60,
  },
  backText: {
    color: "#3B82F6",
    fontSize: 16,
  },
  headerCenter: {
    alignItems: "center",
    gap: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  messages: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: "#7F1D1D",
    fontSize: 13,
  },
});
