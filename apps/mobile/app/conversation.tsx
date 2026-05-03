import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useUser } from "../src/lib/user-context";

export default function ConversationScreen() {
  const { currentUser, otherUser } = useUser();

  useEffect(() => {
    if (!currentUser) router.replace("/");
  }, [currentUser]);

  if (!currentUser || !otherUser) return null;

  return (
    <View style={styles.container}>
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

      <View style={styles.body}>
        <Text style={styles.empty}>No messages yet</Text>
        <Text style={styles.emptyHint}>
          Real-time chat lands in the next phase.
        </Text>
      </View>
    </View>
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
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  empty: {
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 14,
    color: "#CBD5E1",
  },
});
