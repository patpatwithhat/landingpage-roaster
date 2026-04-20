import { NextResponse } from "next/server";

import { MAX_TEXT_CHARS } from "@/lib/analysis/config";
import { analysisProfiles } from "@/lib/analysis/profiles/analysisProfiles";
import {
  buildUserPrompt,
  extractHeadings,
  extractMetaDescription,
  extractTitle,
  fetchPage,
  normalizeUrl,
  stripHtml,
} from "@/lib/analysis/page";
import { analyzeWithOpenAI } from "@/lib/analysis/openai";
import { sanitizeAuditResult, type AnalysisMode, type OutputTone } from "@/lib/analysis/schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string; mode?: AnalysisMode; outputTone?: OutputTone };
    const url = normalizeUrl(body.url ?? "");
    const mode = body.mode ?? "neutral";
    const outputTone = body.outputTone ?? "neutral";
    const modeConfig = analysisProfiles[mode];

    const html = await fetchPage(url.toString());
    const pageText = stripHtml(html).slice(0, MAX_TEXT_CHARS);
    const title = extractTitle(html);
    const metaDescription = extractMetaDescription(html);
    const headings = extractHeadings(html);

    const raw = await analyzeWithOpenAI({
      mode,
      outputTone,
      modeInstructions: modeConfig.instructions,
      userPrompt: buildUserPrompt({
        url,
        modeLabel: modeConfig.label,
        analysisInstructions: modeConfig.instructions,
        title,
        metaDescription,
        headings,
        pageText,
      }),
    });

    const result = sanitizeAuditResult(raw, url, mode, outputTone);

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
