import type { OutputTone } from "../schema";

export type ToneProfile = {
  key: OutputTone;
  label: string;
  description: string;
  selectorLabel: string;
  presentationInstruction: string;
  verdictLabel: string;
  summaryLabel: string;
  problemsLabel: string;
  fixesLabel: string;
  explanationLabel: string;
  rewriteLabel: string;
  signalsLabel: string;
  emphasisPoints: string[];
};

export const toneProfiles: Record<OutputTone, ToneProfile> = {
  newbie: {
    key: "newbie",
    label: "Newbie",
    selectorLabel: "For someone newer to landing pages",
    description: "Prioritizes simpler language, clearer explanations, and the most important fixes first.",
    presentationInstruction:
      "Write for a beginner. Use plain language, reduce jargon, explain why things matter, and emphasize the easiest high-impact fixes first. The verdict should be short and reassuring. The summary should explain the current state in simple terms. Problems should describe what is confusing or missing. Fixes should be ordered from easiest/highest impact to later improvements. Criterion notes should explain things simply instead of sounding technical.",
    verdictLabel: "Beginner-friendly verdict",
    summaryLabel: "What is happening on the page",
    problemsLabel: "Main things to fix first",
    fixesLabel: "Simple next steps",
    explanationLabel: "What the scores mean",
    rewriteLabel: "Simple rewrite ideas",
    signalsLabel: "What the page currently shows",
    emphasisPoints: ["Start with the easiest wins", "Keep the language simple", "Explain why each issue matters"],
  },
  developer: {
    key: "developer",
    label: "Developer",
    selectorLabel: "For a developer who wants implementation direction",
    description: "Keeps the diagnosis sharp and adds more implementation-oriented wording.",
    presentationInstruction:
      "Write for a developer. Be direct, concrete, and implementation-oriented. Explain what should change on the page, where it likely lives, and how to think about fixing it. The verdict can be blunt. The summary should describe likely implementation gaps. Problems should sound like actionable defects or UX gaps. Fixes should read like implementation guidance. Criterion notes should point toward concrete page elements or sections when possible.",
    verdictLabel: "Developer verdict",
    summaryLabel: "What is likely broken in the current implementation",
    problemsLabel: "Implementation-relevant problems",
    fixesLabel: "How to fix it",
    explanationLabel: "Why the scores land here",
    rewriteLabel: "Implementation-ready rewrite ideas",
    signalsLabel: "Relevant implementation signals",
    emphasisPoints: ["Point to likely page sections", "Be concrete about what to change", "Prefer implementation language over marketing language"],
  },
  audit: {
    key: "audit",
    label: "Audit",
    selectorLabel: "For a more formal audit-style assessment",
    description: "Focuses on current state assessment, evidence, and a more review-style tone.",
    presentationInstruction:
      "Write in an audit style. Focus on assessing the current state, citing evidence clearly, and keeping the tone professional and diagnostic. The verdict should summarize the overall state. The summary should read like an assessment. Problems should be phrased as findings. Fixes should be phrased as recommendations. Criterion notes should stay evidence-led and avoid unnecessary personality.",
    verdictLabel: "Audit summary",
    summaryLabel: "Current state assessment",
    problemsLabel: "Primary findings",
    fixesLabel: "Recommended actions",
    explanationLabel: "Scoring breakdown",
    rewriteLabel: "Suggested rewrites",
    signalsLabel: "Observed evidence",
    emphasisPoints: ["Assess current state first", "Cite evidence cleanly", "Keep the tone diagnostic and professional"],
  },
};
