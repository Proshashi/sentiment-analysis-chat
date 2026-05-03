import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { fetchUsers } from "@jingles/api-client";
import type { User } from "@jingles/shared";
import { useUser } from "../src/lib/user-context";

export default function AccountPickerScreen() {
  const { setUsers, setCurrentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localUsers, setLocalUsers] = useState<User[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetched = await fetchUsers();
        if (cancelled) return;
        setLocalUsers(fetched);
        setUsers(fetched);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUsers]);

  function pick(user: User) {
    setCurrentUser(user);
    router.push("/conversation");
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.title}>Jingles</Text>
        <Text style={styles.subtitle}>Pick an account to continue</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Couldn&apos;t reach the server</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.errorHint}>
            Check that EXPO_PUBLIC_API_URL points to your machine&apos;s LAN IP
            and the server is running on port 3001.
          </Text>
        </View>
      ) : (
        <View style={styles.buttons}>
          {localUsers.map((u) => (
            <Pressable
              key={u.id}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: u.avatarColor },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => pick(u)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{u.name[0]}</Text>
              </View>
              <Text style={styles.buttonText}>Login as {u.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  heading: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
  },
  buttons: {
    gap: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 16,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
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
    fontFamily: "Menlo",
    fontSize: 12,
  },
  errorHint: {
    color: "#7F1D1D",
    fontSize: 13,
    marginTop: 4,
  },
});
