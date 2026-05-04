export type UserId = string;
export type ConversationId = string;
export type MessageId = string;

export interface User {
  id: UserId;
  name: string;
  avatarColor: string;
}

export interface Conversation {
  id: ConversationId;
  participantA: UserId;
  participantB: UserId;
  createdAt: number;
}

export const SENTIMENT_LABELS = [
  "warm",
  "neutral",
  "vulnerable",
  "defensive",
  "critical",
  "dismissive",
  "contemptuous",
  "frustrated",
] as const;

export type SentimentLabel = (typeof SENTIMENT_LABELS)[number];

export interface Sentiment {
  label: SentimentLabel;
  score: number;
  explanation: string;
}

export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  content: string;
  createdAt: number;
  sentiment: Sentiment | null;
}

export const PRESEND_TONES = [
  "neutral",
  "defensive",
  "critical",
  "contemptuous",
  "dismissive",
  "passive_aggressive",
  "aggressive",
] as const;

export type PresendTone = (typeof PRESEND_TONES)[number];

export interface PresendAnalysis {
  tone: PresendTone;
  severity: "low" | "medium" | "high";
  shouldPrompt: boolean;
  softerAlternative: string | null;
  explanation: string;
  sentimentLabel: SentimentLabel | null;
}
