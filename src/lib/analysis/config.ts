export const ANALYSIS_MODEL = process.env.LPR_OPENAI_MODEL ?? "gpt-4.1-mini";
export const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
export const MAX_HTML_CHARS = 25000;
export const MAX_TEXT_CHARS = 12000;
export const ANALYSIS_VERSION = "v1";

export const RESPONSE_SHAPE_INSTRUCTION = `Use this JSON shape exactly: {
  "verdict": string,
  "summary": string,
  "rawPageSignals": string[],
  "problems": string[],
  "fixes": string[],
  "rewrites": { "hero": string, "cta": string },
  "buckets": {
    "clarity": {
      "what_it_is": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "who_its_for": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "main_outcome": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "headline_specificity": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "message_focus": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string }
    },
    "cta": {
      "primary_cta_presence": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "above_fold_visibility": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "cta_specificity": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "next_step_clarity": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "cta_focus": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string }
    },
    "trust": {
      "social_proof": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "proof_for_claims": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "company_presence": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "product_evidence": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "credibility_risk": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string }
    },
    "seo": {
      "title_quality": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "meta_description": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "heading_structure": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "content_substance": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string },
      "keyword_alignment": { "status": "strong|okay|weak|missing", "confidence": number, "evidence": string[], "note": string }
    }
  }
}`;
