import { z } from "zod";
import { SENTIMENT_LABELS, PRESEND_TONES } from "./types";

export const messageSendPayload = z.object({
  conversationId: z.string().min(1),
  senderId: z.string().min(1),
  content: z.string().min(1).max(2000),
});
export type MessageSendPayload = z.infer<typeof messageSendPayload>;

export const presendAnalyzePayload = z.object({
  conversationId: z.string().min(1),
  senderId: z.string().min(1),
  draft: z.string().min(1).max(2000),
});
export type PresendAnalyzePayload = z.infer<typeof presendAnalyzePayload>;

export const mediatorRequestPayload = z.object({
  conversationId: z.string().min(1),
  requesterId: z.string().min(1),
});
export type MediatorRequestPayload = z.infer<typeof mediatorRequestPayload>;

export const sentimentSchema = z.object({
  label: z.enum(SENTIMENT_LABELS),
  score: z.number().min(0).max(1),
  explanation: z.string(),
});

export const presendAnalysisSchema = z.object({
  tone: z.enum(PRESEND_TONES),
  severity: z.enum(["low", "medium", "high"]),
  shouldPrompt: z.boolean(),
  softerAlternative: z.string().nullable(),
  explanation: z.string(),
});
