import {
  PRESEND_TONES,
  SENTIMENT_LABELS,
  presendAnalysisSchema,
  type Message,
  type PresendAnalysis,
  type User,
} from "@jingles/shared";
import { anthropic } from "./anthropic";
import { listMessages, listUsers } from "./db";

const SYSTEM_PROMPT = `You analyze draft messages in romantic relationships for communication health.
You look for the Gottman "four horsemen": criticism, contempt, defensiveness, stonewalling.
You also detect aggressive, dismissive, or passive-aggressive tone.

Use the provided tool to return structured analysis. Only set should_prompt=true
if the severity is meaningful enough to interrupt the user. Always provide a
softer_alternative that conveys the same content without the harmful tone when
should_prompt is true.

Always set sentimentLabel to the emotional sentiment that best describes the
draft, regardless of whether shouldPrompt is true. Pick from the provided enum.`;

const ANALYZE_TOOL = {
  name: "analyze_draft",
  description:
    "Classify the tone of a draft message and, if meaningful, propose a softer alternative.",
  input_schema: {
    type: "object" as const,
    properties: {
      tone: {
        type: "string",
        enum: [...PRESEND_TONES],
        description: "The dominant tone of the draft.",
      },
      severity: {
        type: "string",
        enum: ["low", "medium", "high"],
        description:
          "How disruptive this tone is likely to be to the conversation.",
      },
      shouldPrompt: {
        type: "boolean",
        description:
          "True if the user should be interrupted before sending. Only true for medium/high severity defensive, critical, contemptuous, dismissive, passive_aggressive, or aggressive tones.",
      },
      softerAlternative: {
        type: ["string", "null"],
        description:
          "A rewrite of the same message conveying the same content with healthier tone. Required when shouldPrompt is true; otherwise null.",
      },
      explanation: {
        type: "string",
        description:
          "One short sentence (under 25 words) explaining the tone classification.",
      },
      sentimentLabel: {
        type: "string",
        enum: [...SENTIMENT_LABELS],
        description:
          "Emotional sentiment of the draft. Always set, regardless of tone or shouldPrompt.",
      },
    },
    required: [
      "tone",
      "severity",
      "shouldPrompt",
      "softerAlternative",
      "explanation",
      "sentimentLabel",
    ],
  },
};

const CONTEXT_LIMIT = 5;

function nameFor(users: User[], userId: string): string {
  return users.find((u) => u.id === userId)?.name ?? userId;
}

function formatContext(messages: Message[], users: User[]): string {
  if (messages.length === 0) return "(no prior messages)";
  return messages
    .map((m) => `${nameFor(users, m.senderId)}: ${m.content}`)
    .join("\n");
}

export async function analyzeDraft(
  conversationId: string,
  senderId: string,
  draft: string,
): Promise<PresendAnalysis> {
  const users = listUsers();
  const recentContext = listMessages(conversationId).slice(-CONTEXT_LIMIT);
  const senderName = nameFor(users, senderId);

  const userPrompt = `Recent conversation:
${formatContext(recentContext, users)}

${senderName} is about to send this draft:
"${draft}"

Use the analyze_draft tool.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    tools: [ANALYZE_TOOL],
    tool_choice: { type: "tool", name: "analyze_draft" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("model did not return a tool_use block");
  }
  return presendAnalysisSchema.parse(toolUse.input);
}
