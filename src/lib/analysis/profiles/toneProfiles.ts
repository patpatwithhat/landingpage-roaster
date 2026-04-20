import type { OutputTone } from "../schema";

export type ToneProfile = {
  key: OutputTone;
  label: string;
  description: string;
  presentationInstruction: string;
};

export const toneProfiles: Record<OutputTone, ToneProfile> = {
  neutral: {
    key: "neutral",
    label: "Neutral",
    description: "Clear, calm, product-review style wording.",
    presentationInstruction: "Presentation tone should be neutral, clear, and product-review style.",
  },
  goblin: {
    key: "goblin",
    label: "Goblin",
    description: "Playful and sharp, but still useful and not cruel.",
    presentationInstruction: "Presentation tone can be playful and sharp, but still useful and not cruel.",
  },
};
