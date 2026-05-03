import Database from "better-sqlite3";
import path from "node:path";
import type {
  Conversation,
  Message,
  Sentiment,
  SentimentLabel,
  User,
} from "@jingles/shared";

const DB_PATH = path.join(__dirname, "..", "data.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    participant_a TEXT NOT NULL,
    participant_b TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    sentiment_label TEXT,
    sentiment_score REAL,
    sentiment_explanation TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, created_at);
`);

interface UserRow {
  id: string;
  name: string;
  avatar_color: string;
}

interface ConversationRow {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: number;
  sentiment_label: string | null;
  sentiment_score: number | null;
  sentiment_explanation: string | null;
}

const stmts = {
  insertUser: db.prepare(
    "INSERT OR IGNORE INTO users (id, name, avatar_color) VALUES (@id, @name, @avatarColor)",
  ),
  insertConversation: db.prepare(
    "INSERT OR IGNORE INTO conversations (id, participant_a, participant_b, created_at) VALUES (@id, @participantA, @participantB, @createdAt)",
  ),
  listUsers: db.prepare("SELECT id, name, avatar_color FROM users ORDER BY id"),
  getConversation: db.prepare(
    "SELECT id, participant_a, participant_b, created_at FROM conversations WHERE id = ?",
  ),
  insertMessage: db.prepare(
    "INSERT INTO messages (id, conversation_id, sender_id, content, created_at) VALUES (@id, @conversationId, @senderId, @content, @createdAt)",
  ),
  listMessages: db.prepare(
    "SELECT id, conversation_id, sender_id, content, created_at, sentiment_label, sentiment_score, sentiment_explanation FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
  ),
  updateMessageSentiment: db.prepare(
    "UPDATE messages SET sentiment_label = @label, sentiment_score = @score, sentiment_explanation = @explanation WHERE id = @id",
  ),
};

function rowToUser(r: UserRow): User {
  return { id: r.id, name: r.name, avatarColor: r.avatar_color };
}

function rowToMessage(r: MessageRow): Message {
  const sentiment: Sentiment | null =
    r.sentiment_label && r.sentiment_score !== null
      ? {
          label: r.sentiment_label as SentimentLabel,
          score: r.sentiment_score,
          explanation: r.sentiment_explanation ?? "",
        }
      : null;
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    content: r.content,
    createdAt: r.created_at,
    sentiment,
  };
}

export function insertUser(user: User): void {
  stmts.insertUser.run(user);
}

export function insertConversation(conversation: Conversation): void {
  stmts.insertConversation.run(conversation);
}

export function listUsers(): User[] {
  return (stmts.listUsers.all() as UserRow[]).map(rowToUser);
}

export function getConversation(id: string): Conversation | null {
  const row = stmts.getConversation.get(id) as ConversationRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    participantA: row.participant_a,
    participantB: row.participant_b,
    createdAt: row.created_at,
  };
}

export function insertMessage(msg: Omit<Message, "sentiment">): void {
  stmts.insertMessage.run(msg);
}

export function listMessages(conversationId: string): Message[] {
  return (stmts.listMessages.all(conversationId) as MessageRow[]).map(
    rowToMessage,
  );
}

export function updateMessageSentiment(
  id: string,
  sentiment: Sentiment,
): void {
  stmts.updateMessageSentiment.run({ id, ...sentiment });
}
