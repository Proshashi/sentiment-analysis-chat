import type { Message, User } from "@jingles/shared";
import { anthropic } from "./anthropic";
import { listMessages, listUsers } from "./db";

const SYSTEM_PROMPT = `You are a neutral relationship communication mediator. You are not a therapist
and you don't diagnose. Your job is to help two people understand each other better.

Principles:
- Never take sides
- Reflect what each person seems to be feeling and needing
- Suggest one concrete, low-stakes next step
- Acknowledge both perspectives
- Never recommend ending the relationship
- Keep response under 150 words
- Respond with your guidance directly. Do not ask follow-up questions or offer to do additional things you cannot do (no "want me to draft a reply?", no "let me know if you'd like…", no "shall I…?"). End the response after your suggestion.`;

const MAX_HISTORY = 20;

function nameFor(users: User[], userId: string): string {
  return users.find((u) => u.id === userId)?.name ?? userId;
}

function formatHistory(messages: Message[], users: User[]): string {
  return messages
    .map((m) => `${nameFor(users, m.senderId)}: ${m.content}`)
    .join("\n");
}

export interface MediatorCallbacks {
  onChunk: (delta: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

const responseCache = new Map<string, string>();

function cacheKey(
  conversationId: string,
  requesterId: string,
  history: Message[],
): string {
  const lastId = history[history.length - 1]?.id ?? "empty";
  return `${conversationId}::${lastId}::${requesterId}`;
}

export async function streamMediator(
  conversationId: string,
  requesterId: string,
  cb: MediatorCallbacks,
): Promise<void> {
  try {
    const users = listUsers();
    const history = listMessages(conversationId).slice(-MAX_HISTORY);

    if (history.length === 0) {
      cb.onError(new Error("no messages to mediate yet"));
      return;
    }

    const key = cacheKey(conversationId, requesterId, history);
    const cached = responseCache.get(key);
    if (cached) {
      cb.onChunk(cached);
      cb.onDone();
      return;
    }

    const requesterName = nameFor(users, requesterId);
    const userPrompt = `Below is a conversation between two people. ${requesterName} is asking you for guidance.

${formatHistory(history, users)}

Please respond as the mediator now.`;

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    let buffered = "";
    stream.on("text", (delta) => {
      buffered += delta;
      cb.onChunk(delta);
    });

    await stream.finalMessage();
    if (buffered.length > 0) responseCache.set(key, buffered);
    cb.onDone();
  } catch (err) {
    cb.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
