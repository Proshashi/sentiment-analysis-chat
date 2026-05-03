import { useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { MediatorOverlay } from "../src/components/mediator-overlay";
import {
  MessageInput,
  type MessageInputHandle,
} from "../src/components/message-input";
import { MessageList } from "../src/components/message-list";
import { PresendModal } from "../src/components/presend-modal";
import { TypingIndicator } from "../src/components/typing-indicator";
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
  const inputRef = useRef<MessageInputHandle>(null);
  const {
    send,
    error,
    mediator,
    requestMediator,
    dismissMediator,
    presend,
    analyzeDraft,
    clearPresend,
    typingUsers,
    emitTypingStart,
    emitTypingStop,
  } = useConversationSocket({
    conversationId: CONVERSATION_ID,
    userId: currentUser?.id ?? "",
  });

  if (!currentUser || !otherUser) return null;

  const canMediate = messages.length >= 2 && !mediator.streaming;

  const presendVisible =
    presend.analysis !== null && presend.analysis.shouldPrompt;

  function handleUseSofter(softer: string) {
    inputRef.current?.setText(softer);
    clearPresend();
  }

  function handleSendAnyway() {
    if (presend.draft) send(presend.draft);
    inputRef.current?.clear();
    clearPresend();
  }

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
        <Pressable
          onPress={requestMediator}
          disabled={!canMediate}
          style={({ pressed }) => [
            styles.mediatorButton,
            !canMediate && styles.mediatorDisabled,
            pressed && canMediate && { opacity: 0.7 },
          ]}
        >
          <Text
            style={[
              styles.mediatorText,
              !canMediate && styles.mediatorTextDisabled,
            ]}
          >
            Mediator
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Connection problem: {error}</Text>
        </View>
      ) : null}

      <View style={styles.messages}>
        <MessageList messages={messages} currentUserId={currentUser.id} />
      </View>

      {typingUsers.includes(otherUser.id) ? (
        <TypingIndicator name={otherUser.name} />
      ) : null}

      <MessageInput
        ref={inputRef}
        onSend={(content) => {
          send(content);
          clearPresend();
        }}
        onAnalyze={analyzeDraft}
        onTypingStart={emitTypingStart}
        onTypingStop={emitTypingStop}
      />

      <MediatorOverlay state={mediator} onClose={dismissMediator} />

      <PresendModal
        visible={presendVisible}
        draft={presend.draft}
        analysis={presend.analysis}
        onUseSofter={handleUseSofter}
        onSendAnyway={handleSendAnyway}
        onDismiss={clearPresend}
      />
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
    minWidth: 70,
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
  mediatorButton: {
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
  },
  mediatorDisabled: {
    backgroundColor: "#F1F5F9",
  },
  mediatorText: {
    color: "#7C3AED",
    fontSize: 13,
    fontWeight: "700",
  },
  mediatorTextDisabled: {
    color: "#94A3B8",
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
