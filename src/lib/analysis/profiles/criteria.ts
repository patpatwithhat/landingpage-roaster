export type ScoreBucketKey = "clarity" | "cta" | "trust" | "seo";
export type CriterionStatus = "strong" | "okay" | "weak" | "missing";

export type CriterionDefinition = {
  key: string;
  label: string;
  helpText: string;
};

export type ScoreBucketDefinition = {
  key: ScoreBucketKey;
  label: string;
  helpText: string;
  criteria: CriterionDefinition[];
};

export const scoreBuckets: ScoreBucketDefinition[] = [
  {
    key: "clarity",
    label: "Clarity",
    helpText: "How quickly the page makes the offer, audience, outcome, and main message understandable.",
    criteria: [
      {
        key: "what_it_is",
        label: "What it is",
        helpText: "Can a new visitor quickly tell what the product or service actually is?",
      },
      {
        key: "who_its_for",
        label: "Who it is for",
        helpText: "Does the page clearly indicate the target audience or buyer?",
      },
      {
        key: "main_outcome",
        label: "Main outcome",
        helpText: "Is the core benefit or result obvious instead of implied?",
      },
      {
        key: "headline_specificity",
        label: "Headline specificity",
        helpText: "Is the headline concrete and specific rather than polished but vague?",
      },
      {
        key: "message_focus",
        label: "Message focus",
        helpText: "Does the page stay focused on one message instead of scattering attention?",
      },
    ],
  },
  {
    key: "cta",
    label: "CTA",
    helpText: "How clearly the page guides visitors to one meaningful next step.",
    criteria: [
      {
        key: "primary_cta_presence",
        label: "Primary CTA present",
        helpText: "Is there a clear main action the visitor can take?",
      },
      {
        key: "above_fold_visibility",
        label: "Above-the-fold visibility",
        helpText: "Is that main action visible early without much scrolling?",
      },
      {
        key: "cta_specificity",
        label: "CTA specificity",
        helpText: "Does the CTA wording explain the next step clearly?",
      },
      {
        key: "next_step_clarity",
        label: "Next step clarity",
        helpText: "Does the page make the journey after the click feel obvious?",
      },
      {
        key: "cta_focus",
        label: "CTA focus",
        helpText: "Is there one main action instead of too many competing asks?",
      },
    ],
  },
  {
    key: "trust",
    label: "Trust",
    helpText: "How much credibility, proof, and legitimacy the page communicates.",
    criteria: [
      {
        key: "social_proof",
        label: "Social proof",
        helpText: "Are there testimonials, logos, ratings, or customer references?",
      },
      {
        key: "proof_for_claims",
        label: "Proof for claims",
        helpText: "Are important claims backed up by evidence or specifics?",
      },
      {
        key: "company_presence",
        label: "Company presence",
        helpText: "Does the page show signs of a real company or operator behind it?",
      },
      {
        key: "product_evidence",
        label: "Product evidence",
        helpText: "Are there screenshots, demos, or tangible examples of the thing?",
      },
      {
        key: "credibility_risk",
        label: "Credibility risk",
        helpText: "Does the page avoid scammy, vague, or suspicious signals?",
      },
    ],
  },
  {
    key: "seo",
    label: "SEO",
    helpText: "Whether the page covers core on-page SEO basics and gives search engines enough context.",
    criteria: [
      {
        key: "title_quality",
        label: "Title quality",
        helpText: "Is there a useful title tag that describes the page well?",
      },
      {
        key: "meta_description",
        label: "Meta description",
        helpText: "Is there a meta description that helps search snippets and click-through?",
      },
      {
        key: "heading_structure",
        label: "Heading structure",
        helpText: "Does the page use headings in a way that creates clear structure?",
      },
      {
        key: "content_substance",
        label: "Content substance",
        helpText: "Is there enough real content for humans and search engines to understand the page?",
      },
      {
        key: "keyword_alignment",
        label: "Keyword alignment",
        helpText: "Do the main terms in the page appear aligned with the offer and intent?",
      },
    ],
  },
];
