import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { UserProvider } from "../src/lib/user-context";

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="conversation" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </UserProvider>
  );
}
