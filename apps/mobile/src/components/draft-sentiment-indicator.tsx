import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import type { SentimentLabel } from "@jingles/shared";
import { SENTIMENT_COLORS } from "../lib/sentiment-colors";

interface Props {
  label: SentimentLabel | null;
}

export function DraftSentimentIndicator({ label }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: label ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [label, opacity]);

  if (!label) return <View style={styles.placeholder} />;

  return (
    <Animated.View style={[styles.row, { opacity }]}>
      <Text style={styles.prefix}>Your tone:</Text>
      <View
        style={[styles.dot, { backgroundColor: SENTIMENT_COLORS[label] }]}
      />
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 4,
    height: 24,
  },
  prefix: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 2,
  },
  label: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
});
