import type { OutputTone } from "../schema";

export type ToneProfile = {
  key: OutputTone;
  label: string;
  description: string;
  selectorLabel: string;
  presentationInstruction: string;
  verdictLabel: string;
  problemsLabel: string;
  fixesLabel: string;
  explanationLabel: string;
  rewriteLabel: string;
};

export const toneProfiles: Record<OutputTone, ToneProfile> = {
  newbie: {
    key: "newbie",
    label: "Newbie",
    selectorLabel: "For someone newer to landing pages",
    description: "Prioritizes simpler language, clearer explanations, and the most important fixes first.",
    presentationInstruction:
      "Write for a beginner. Use plain language, reduce jargon, explain why things matter, and emphasize the easiest high-impact fixes first.",
    verdictLabel: "Beginner-friendly verdict",
    problemsLabel: "Main things to fix first",
    fixesLabel: "Simple next steps",
    explanationLabel: "What the scores mean",
    rewriteLabel: "Simple rewrite ideas",
  },
  developer: {
    key: "developer",
    label: "Developer",
    selectorLabel: "For a developer who wants implementation direction",
    description: "Keeps the diagnosis sharp and adds more implementation-oriented wording.",
    presentationInstruction:
      "Write for a developer. Be direct, concrete, and implementation-oriented. Explain what should change on the page and how to think about fixing it.",
    verdictLabel: "Developer verdict",
    problemsLabel: "Implementation-relevant problems",
    fixesLabel: "How to fix it",
    explanationLabel: "Why the scores land here",
    rewriteLabel: "Implementation-ready rewrite ideas",
  },
  audit: {
    key: "audit",
    label: "Audit",
    selectorLabel: "For a more formal audit-style assessment",
    description: "Focuses on current state assessment, evidence, and a more review-style tone.",
    presentationInstruction:
      "Write in an audit style. Focus on assessing the current state, citing evidence clearly, and keeping the tone professional and diagnostic.",
    verdictLabel: "Audit summary",
    problemsLabel: "Primary findings",
    fixesLabel: "Recommended actions",
    explanationLabel: "Scoring breakdown",
    rewriteLabel: "Suggested rewrites",
  },
};
