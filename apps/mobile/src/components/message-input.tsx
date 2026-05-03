import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

interface Props {
  onSend: (content: string) => void;
  onAnalyze?: (draft: string) => void;
  disabled?: boolean;
}

export interface MessageInputHandle {
  setText: (text: string) => void;
  clear: () => void;
}

const ANALYZE_DEBOUNCE_MS = 1000;
const ANALYZE_MIN_LENGTH = 8;

export const MessageInput = forwardRef<MessageInputHandle, Props>(
  function MessageInput({ onSend, onAnalyze, disabled }, ref) {
    const [draft, setDraft] = useState("");
    const lastAnalyzedRef = useRef<string>("");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useImperativeHandle(ref, () => ({
      setText: (text: string) => setDraft(text),
      clear: () => setDraft(""),
    }));

    useEffect(() => {
      if (!onAnalyze) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      const trimmed = draft.trim();
      if (trimmed.length < ANALYZE_MIN_LENGTH) return;
      if (trimmed === lastAnalyzedRef.current) return;
      timerRef.current = setTimeout(() => {
        lastAnalyzedRef.current = trimmed;
        onAnalyze(trimmed);
      }, ANALYZE_DEBOUNCE_MS);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [draft, onAnalyze]);

    function handleSend() {
      const trimmed = draft.trim();
      if (!trimmed) return;
      onSend(trimmed);
      setDraft("");
      lastAnalyzedRef.current = "";
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
  },
);

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
