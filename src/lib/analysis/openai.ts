import { ANALYSIS_MODEL, OPENAI_URL, RESPONSE_SHAPE_INSTRUCTION } from "./config";
import { toneProfiles } from "./profiles/toneProfiles";
import type { OutputTone, RawAuditPayload } from "./schema";

type OpenAIMessage = {
  role: "system" | "user";
  content: string;
};

export function buildSystemPrompt(outputTone: OutputTone, modeInstructions: string[]) {
  return [
    "You analyze landing pages for conversion quality.",
    "Be specific, grounded in the provided page signals, and avoid generic fluff.",
    "Return valid JSON only.",
    "The underlying analysis must stay neutral and diagnostic, even if the requested presentation mode changes.",
    "Assess each criterion explicitly instead of inventing top-level scores directly.",
    "Problems and fixes should contain exactly 3 items each.",
    "rawPageSignals should contain 3 to 6 concise factual observations from the page.",
    ...modeInstructions,
    toneProfiles[outputTone].presentationInstruction,
    RESPONSE_SHAPE_INSTRUCTION,
  ].join(" ");
}

export async function analyzeWithOpenAI(input: {
  userPrompt: string;
  outputTone: OutputTone;
  modeInstructions: string[];
}) {
  const apiKey = process.env.LPR_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing LPR_OPENAI_API_KEY.");
  }

  const messages: OpenAIMessage[] = [
    { role: "system", content: buildSystemPrompt(input.outputTone, input.modeInstructions) },
    { role: "user", content: input.userPrompt },
  ];

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return JSON.parse(content) as RawAuditPayload;
}
