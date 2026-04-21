import {
  ANALYSIS_MODEL,
  CORE_RESPONSE_SHAPE_INSTRUCTION,
  OPENAI_URL,
  PRESENTATION_RESPONSE_SHAPE_INSTRUCTION,
} from "./config";
import { toneProfiles } from "./profiles/toneProfiles";
import type { CoreAnalysis, OutputTone, PresentationPayload, RawAuditPayload } from "./schema";

type OpenAIMessage = {
  role: "system" | "user";
  content: string;
};

function buildCoreSystemPrompt(modeInstructions: string[]) {
  return [
    "You analyze landing pages for conversion quality.",
    "Your job in this pass is only the neutral diagnostic core.",
    "Do not adapt standards based on audience, reader sophistication, or presentation style.",
    "Judge the same page the same way regardless of who will later read the report.",
    "Be specific, grounded in the provided page signals, and avoid generic fluff.",
    "Return valid JSON only.",
    "Assess each criterion explicitly instead of inventing top-level scores directly.",
    "rawPageSignals should contain 3 to 6 concise factual observations from the page.",
    "Criterion notes must stay neutral, evidence-led, and tone-invariant.",
    ...modeInstructions,
    CORE_RESPONSE_SHAPE_INSTRUCTION,
  ].join(" ");
}

function buildPresentationSystemPrompt(outputTone: OutputTone) {
  return [
    "You turn an existing neutral landing-page analysis into a presentation for a specific audience.",
    "Do not change the underlying findings, standards, or scoring.",
    "Problems and fixes should contain exactly 3 items each.",
    `Audience mode: ${toneProfiles[outputTone].label}.`,
    toneProfiles[outputTone].presentationInstruction,
    PRESENTATION_RESPONSE_SHAPE_INSTRUCTION,
  ].join(" ");
}

async function callOpenAI(messages: OpenAIMessage[]) {
  const apiKey = process.env.LPR_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing LPR_OPENAI_API_KEY.");
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      temperature: 0,
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

  return JSON.parse(content) as Record<string, unknown>;
}

export async function analyzeCoreWithOpenAI(input: {
  userPrompt: string;
  modeInstructions: string[];
}) {
  const messages: OpenAIMessage[] = [
    { role: "system", content: buildCoreSystemPrompt(input.modeInstructions) },
    { role: "user", content: input.userPrompt },
  ];

  return (await callOpenAI(messages)) as RawAuditPayload;
}

export async function presentAnalysisWithOpenAI(input: {
  outputTone: OutputTone;
  analyzedUrl: string;
  domain: string;
  coreAnalysis: CoreAnalysis;
}) {
  const messages: OpenAIMessage[] = [
    { role: "system", content: buildPresentationSystemPrompt(input.outputTone) },
    {
      role: "user",
      content: [
        `URL: ${input.analyzedUrl}`,
        `Domain: ${input.domain}`,
        "Use the following neutral analysis as the single source of truth. Do not change its findings or invent new evidence.",
        JSON.stringify(input.coreAnalysis),
      ].join("\n\n"),
    },
  ];

  return (await callOpenAI(messages)) as PresentationPayload;
}
