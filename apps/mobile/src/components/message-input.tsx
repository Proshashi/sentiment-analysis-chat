import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: Props) {
  const [draft, setDraft] = useState("");

  function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft("");
  }

  const canSend = draft.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder="Message"
        placeholderTextColor="#94A3B8"
        multiline
        editable={!disabled}
        returnKeyType="default"
      />
      <Pressable
        style={({ pressed }) => [
          styles.sendButton,
          !canSend && styles.sendDisabled,
          pressed && canSend && styles.sendPressed,
        ]}
        onPress={handleSend}
        disabled={!canSend}
      >
        <View
          style={[
            styles.sendArrow,
            !canSend && styles.sendArrowDisabled,
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    fontSize: 16,
    color: "#0F172A",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    backgroundColor: "#CBD5E1",
  },
  sendPressed: {
    opacity: 0.8,
  },
  sendArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#FFFFFF",
    marginLeft: 3,
  },
  sendArrowDisabled: {
    borderLeftColor: "#FFFFFF",
    opacity: 0.7,
  },
});
