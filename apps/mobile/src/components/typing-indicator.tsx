import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface Props {
  name: string;
}

const DOT_DURATION = 600;
const DOT_STAGGER = 200;

function useDotPulse(delay: number) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: DOT_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: DOT_DURATION / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);

  return opacity;
}

export function TypingIndicator({ name }: Props) {
  const dot1 = useDotPulse(0);
  const dot2 = useDotPulse(DOT_STAGGER);
  const dot3 = useDotPulse(DOT_STAGGER * 2);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{name} is typing</Text>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    height: 28,
  },
  text: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  dots: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#94A3B8",
  },
});
