import { createHash } from "node:crypto";

import { ANALYSIS_VERSION, MAX_TEXT_CHARS } from "./config";
import { analyzeWithOpenAI } from "./openai";
import { fetchPage, normalizeUrl, stripHtml, extractTitle, extractMetaDescription, extractHeadings, buildUserPrompt } from "./page";
import { analysisProfiles } from "./profiles/analysisProfiles";
import { loadStoredReport, storeReport } from "./report-store";
import { buildBucketResults, getTopLevelScores } from "./scoring";
import { sanitizeRawAnalysis, type AnalysisMode, type AuditResult, type OutputTone } from "./schema";

export async function getAnalysisReport(input: { url: string; mode?: AnalysisMode; outputTone?: OutputTone }) {
  const url = normalizeUrl(input.url);
  const mode = input.mode ?? "neutral";
  const outputTone = input.outputTone ?? "audit";
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
    outputTone,
  });

  if (cachedReport) {
    return {
      ...cachedReport,
      outputTone,
      reportSource: "cache",
    } satisfies AuditResult;
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

  return result;
}
