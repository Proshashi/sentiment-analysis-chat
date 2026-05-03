import { StyleSheet, Text, View } from "react-native";
import type { Message } from "@jingles/shared";
import { SentimentIndicator } from "./sentiment-indicator";

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.row,
          isOwn ? styles.rowOwn : styles.rowOther,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          <Text style={isOwn ? styles.textOwn : styles.textOther}>
            {message.content}
          </Text>
        </View>
      </View>
      {message.sentiment ? (
        <SentimentIndicator label={message.sentiment.label} isOwn={isOwn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 2,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: "#3B82F6",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#E2E8F0",
    borderBottomLeftRadius: 4,
  },
  textOwn: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
  },
  textOther: {
    color: "#0F172A",
    fontSize: 16,
    lineHeight: 21,
  },
});
