export const ANALYSIS_MODEL = process.env.LPR_OPENAI_MODEL ?? "gpt-4.1-mini";
export const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
export const MAX_HTML_CHARS = 25000;
export const MAX_TEXT_CHARS = 12000;

export const RESPONSE_SHAPE_INSTRUCTION =
  'Use this JSON shape exactly: {"verdict":string,"summary":string,"clarity":number,"cta":number,"trust":number,"seo":number,"problems":string[],"fixes":string[],"heroRewrite":string,"ctaRewrite":string,"rawPageSignals":string[]}';
