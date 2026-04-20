import type { AnalysisMode } from "../schema";

export type AnalysisProfile = {
  key: AnalysisMode;
  label: string;
  badge: string;
  description: string;
  instructions: string[];
};

export const analysisProfiles: Record<AnalysisMode, AnalysisProfile> = {
  neutral: {
    key: "neutral",
    label: "Neutral diagnostic core",
    badge: "Neutral diagnostic core",
    description:
      "Runs a neutral conversion-focused review that we can later restyle without changing the underlying analysis.",
    instructions: [
      "Assess the page like a conversion-focused reviewer, not a brand copywriter.",
      "Prioritize clarity, CTA quality, trust signals, and SEO basics.",
      "Keep the underlying reasoning neutral and reusable for future prompt tuning.",
    ],
  },
};
