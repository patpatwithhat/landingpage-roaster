import { createHash } from "node:crypto";

import { ANALYSIS_VERSION, MAX_TEXT_CHARS } from "./config";
import { analyzeCoreWithOpenAI, presentAnalysisWithOpenAI } from "./openai";
import { fetchPage, normalizeUrl, stripHtml, extractTitle, extractMetaDescription, extractHeadings, buildUserPrompt } from "./page";
import { analysisProfiles } from "./profiles/analysisProfiles";
import { loadStoredCoreAnalysis, loadStoredPresentation, storeCoreAnalysis, storePresentation } from "./report-store";
import { buildBucketResults, getTopLevelScores } from "./scoring";
import { sanitizeCoreAnalysis, sanitizePresentation, type AnalysisMode, type AuditResult, type CoreAnalysis, type OutputTone } from "./schema";

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

  const cachedPresentation = await loadStoredPresentation({
    normalizedUrl: url.toString(),
    analysisVersion: ANALYSIS_VERSION,
    contentHash,
    outputTone,
  });

  if (cachedPresentation) {
    return {
      ...cachedPresentation,
      outputTone,
      reportSource: "cache",
    } satisfies AuditResult;
  }

  const cachedCore = await loadStoredCoreAnalysis({
    normalizedUrl: url.toString(),
    analysisVersion: ANALYSIS_VERSION,
    contentHash,
  });

  let resolvedCore: CoreAnalysis | null = cachedCore;

  if (!cachedCore) {
    const rawCore = await analyzeCoreWithOpenAI({
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

    const sanitizedCore = sanitizeCoreAnalysis(rawCore);
    const buckets = buildBucketResults(sanitizedCore.buckets);
    resolvedCore = {
      rawPageSignals: sanitizedCore.rawPageSignals,
      buckets,
      scores: getTopLevelScores(buckets),
    };

    await storeCoreAnalysis({
      normalizedUrl: url.toString(),
      analysisVersion: ANALYSIS_VERSION,
      contentHash,
      coreAnalysis: resolvedCore,
    });
  }

  if (!resolvedCore) {
    throw new Error("Failed to build core analysis.");
  }

  const rawPresentation = await presentAnalysisWithOpenAI({
    outputTone,
    analyzedUrl: url.toString(),
    domain: url.hostname,
    coreAnalysis: resolvedCore,
  });

  const presentation = sanitizePresentation(rawPresentation);
  const result: AuditResult = {
    domain: url.hostname,
    analyzedUrl: url.toString(),
    mode,
    outputTone,
    analysisVersion: ANALYSIS_VERSION,
    contentHash,
    reportSource: "fresh",
    structuredAnalysis: {
      verdict: presentation.verdict,
      summary: presentation.summary,
      rawPageSignals: resolvedCore.rawPageSignals,
      problems: presentation.problems,
      fixes: presentation.fixes,
      rewrites: presentation.rewrites,
      buckets: resolvedCore.buckets,
      scores: resolvedCore.scores,
    },
  };

  await storePresentation(result);

  return result;
}
