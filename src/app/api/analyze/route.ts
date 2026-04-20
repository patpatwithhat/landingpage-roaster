import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { ANALYSIS_VERSION, MAX_TEXT_CHARS } from "@/lib/analysis/config";
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
import { loadStoredReport, storeReport } from "@/lib/analysis/report-store";
import { buildBucketResults, getTopLevelScores } from "@/lib/analysis/scoring";
import { sanitizeRawAnalysis, type AnalysisMode, type AuditResult, type OutputTone } from "@/lib/analysis/schema";

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

    const contentHash = createHash("sha256")
      .update([title, metaDescription, headings.join("|"), pageText].join("\n\n"))
      .digest("hex");

    const cachedReport = await loadStoredReport({
      normalizedUrl: url.toString(),
      analysisVersion: ANALYSIS_VERSION,
      contentHash,
    });

    if (cachedReport) {
      return NextResponse.json({
        result: {
          ...cachedReport,
          outputTone,
          reportSource: "cache",
        } satisfies AuditResult,
      });
    }

    const raw = await analyzeWithOpenAI({
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

    const sanitized = sanitizeRawAnalysis(raw);
    const buckets = buildBucketResults(sanitized.buckets);
    const result: AuditResult = {
      domain: url.hostname,
      analyzedUrl: url.toString(),
      mode,
      outputTone,
      analysisVersion: ANALYSIS_VERSION,
      contentHash,
      reportSource: "fresh",
      structuredAnalysis: {
        verdict: sanitized.verdict,
        summary: sanitized.summary,
        rawPageSignals: sanitized.rawPageSignals,
        problems: sanitized.problems,
        fixes: sanitized.fixes,
        rewrites: sanitized.rewrites,
        buckets,
        scores: getTopLevelScores(buckets),
      },
    };

    await storeReport(result);

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
