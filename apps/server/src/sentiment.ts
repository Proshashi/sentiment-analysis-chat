import {
  SENTIMENT_LABELS,
  sentimentSchema,
  type Message,
  type Sentiment,
} from "@jingles/shared";
import { anthropic } from "./anthropic";

const SYSTEM_PROMPT = `You analyze messages in romantic relationships for emotional tone.
Use the provided tool to classify the message.`;

const CLASSIFY_TOOL = {
  name: "classify_message",
  description:
    "Classify the emotional tone of a message in the context of a romantic relationship.",
  input_schema: {
    type: "object" as const,
    properties: {
      label: {
        type: "string",
        enum: [...SENTIMENT_LABELS],
        description: "The sentiment label that best fits the message.",
      },
      score: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Confidence in the chosen label between 0 and 1.",
      },
      explanation: {
        type: "string",
        description:
          "One short sentence (under 25 words) describing why this label fits.",
      },
    },
    required: ["label", "score", "explanation"],
  },
};

function formatContext(messages: Message[], sender: string): string {
  if (messages.length === 0) return "(no prior messages)";
  return messages
    .map((m) => `${m.senderId === sender ? "self" : "partner"}: ${m.content}`)
    .join("\n");
}

export async function analyzeSentiment(
  newMessage: Message,
  recentContext: Message[],
): Promise<Sentiment> {
  const userPrompt = `Conversation so far (most recent first omitted, oldest first shown):
${formatContext(recentContext, newMessage.senderId)}

New message from ${newMessage.senderId === recentContext[0]?.senderId ? "the same person" : "the sender"}:
"${newMessage.content}"

Classify the new message using the classify_message tool.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "classify_message" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("model did not return a tool_use block");
  }
  return sentimentSchema.parse(toolUse.input);
}
