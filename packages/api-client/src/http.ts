import type { Message, User } from "@jingles/shared";

export function getApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. Add it to apps/mobile/.env (e.g. http://192.168.1.42:3001).",
    );
  }
  return url;
}

export async function fetchHealth(): Promise<{ ok: boolean }> {
  const res = await fetch(`${getApiUrl()}/health`);
  if (!res.ok) throw new Error(`health failed: ${res.status}`);
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${getApiUrl()}/users`);
  if (!res.ok) throw new Error(`users failed: ${res.status}`);
  return res.json();
}

export async function fetchMessages(
  conversationId: string,
): Promise<Message[]> {
  const res = await fetch(
    `${getApiUrl()}/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
  if (!res.ok) throw new Error(`messages failed: ${res.status}`);
  return res.json();
}
