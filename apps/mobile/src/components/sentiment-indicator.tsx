import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import type { SentimentLabel } from "@jingles/shared";

const COLORS: Record<SentimentLabel, string> = {
  warm: "#10B981",
  neutral: "#94A3B8",
  vulnerable: "#6366F1",
  defensive: "#F59E0B",
  critical: "#EF4444",
  dismissive: "#64748B",
  contemptuous: "#991B1B",
  frustrated: "#F97316",
};

interface Props {
  label: SentimentLabel;
  isOwn: boolean;
}

export function SentimentIndicator({ label, isOwn }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [label, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.row,
        isOwn ? styles.rowOwn : styles.rowOther,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: COLORS[label] }]} />
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
});
