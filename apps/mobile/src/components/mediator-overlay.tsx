import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Markdown, { renderRules } from "react-native-markdown-display";
import type { MediatorState } from "../lib/use-conversation-socket";

type TextNode = { key: string; content: string };
type StyleObj = Record<string, object | undefined>;

const SELECTION_COLOR = "#7C3AED50";

const selectableRules = {
  ...renderRules,
  text: (
    node: TextNode,
    _children: unknown,
    _parent: unknown,
    styles: StyleObj,
    inheritedStyles: object = {},
  ) => (
    <Text
      key={node.key}
      style={[inheritedStyles, styles.text]}
      selectable
      selectionColor={SELECTION_COLOR}
    >
      {node.content}
    </Text>
  ),
  textgroup: (
    node: TextNode,
    children: React.ReactNode,
    _parent: unknown,
    styles: StyleObj,
  ) => (
    <Text
      key={node.key}
      style={styles.textgroup}
      selectable
      selectionColor={SELECTION_COLOR}
    >
      {children}
    </Text>
  ),
};

interface Props {
  state: MediatorState;
  onClose: () => void;
}

export function MediatorOverlay({ state, onClose }: Props) {
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!state.streaming) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state.streaming, cursorOpacity]);

  return (
    <Modal
      visible={state.open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.dot} />
            <Text style={styles.headerTitle}>AI Mediator</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {state.error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Couldn&apos;t generate a response</Text>
              <Text style={styles.errorBody}>{state.error}</Text>
            </View>
          ) : state.text.length === 0 && state.streaming ? (
            <View style={styles.loading}>
              <ActivityIndicator color="#7C3AED" />
              <Text style={styles.loadingText}>Thinking…</Text>
            </View>
          ) : (
            <View>
              <Markdown style={markdownStyles} rules={selectableRules}>
                {state.text}
              </Markdown>
              {state.streaming ? (
                <Animated.Text
                  style={[styles.cursor, { opacity: cursorOpacity }]}
                >
                  ▍
                </Animated.Text>
              ) : null}
            </View>
          )}
        </ScrollView>

        {!state.streaming && !state.error ? (
          <View style={styles.footerHint}>
            <Text style={styles.footerHintText}>
              The mediator&apos;s suggestions are perspectives, not directions.
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDD6FE",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#7C3AED",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4C1D95",
    letterSpacing: -0.2,
  },
  closeButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  closeText: {
    color: "#7C3AED",
    fontSize: 16,
    fontWeight: "600",
  },
  bodyScroll: {
    flex: 1,
  },
  body: {
    padding: 24,
    paddingBottom: 48,
  },
  text: {
    fontSize: 17,
    lineHeight: 26,
    color: "#1E1B4B",
  },
  cursor: {
    color: "#7C3AED",
    fontSize: 16,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
  },
  loadingText: {
    color: "#6D28D9",
    fontSize: 15,
    fontStyle: "italic",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  errorTitle: {
    color: "#991B1B",
    fontWeight: "700",
    fontSize: 16,
  },
  errorBody: {
    color: "#7F1D1D",
    fontSize: 13,
  },
  footerHint: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DDD6FE",
  },
  footerHintText: {
    fontSize: 12,
    color: "#7C3AED",
    textAlign: "center",
    fontStyle: "italic",
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 17,
    lineHeight: 26,
    color: "#1E1B4B",
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  heading1: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4C1D95",
    marginTop: 12,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 19,
    fontWeight: "700",
    color: "#4C1D95",
    marginTop: 12,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4C1D95",
    marginTop: 10,
    marginBottom: 4,
  },
  strong: {
    fontWeight: "700",
    color: "#4C1D95",
  },
  em: {
    fontStyle: "italic",
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
  },
  bullet_list_icon: {
    color: "#7C3AED",
  },
  code_inline: {
    backgroundColor: "#EDE9FE",
    color: "#4C1D95",
    paddingHorizontal: 4,
    borderRadius: 4,
    fontFamily: "Menlo",
    fontSize: 15,
  },
  blockquote: {
    backgroundColor: "#EDE9FE",
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 6,
  },
});
