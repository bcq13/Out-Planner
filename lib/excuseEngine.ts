export type Audience = "work" | "friends" | "family";

export type Tone =
  | "kind"
  | "professional"
  | "funny"
  | "spicy"
  | "firm"
  | "noDetails";

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const BANK: Record<Tone, string[]> = {
  kind: [
    "I can’t make it today, but thank you for thinking of me.",
    "I’m going to pass this time — I really appreciate the invite.",
    "I’m not available, but I hope it goes well.",
    "I need a quiet day today — thank you for understanding.",
  ],
  professional: [
    "I’m unavailable due to a scheduling conflict.",
    "I won’t be able to attend as planned.",
    "I need to decline due to prior commitments.",
  ],
  funny: [
    "My calendar said absolutely not.",
    "I have a prior commitment to doing nothing.",
    "Today is not a people day.",
  ],
  spicy: [
    "No thanks.",
    "Hard pass.",
    "I’m opting out.",
  ],
  firm: [
    "I’m not available.",
    "That doesn’t work for me.",
    "I’m saying no.",
  ],
  noDetails: [
    "I can’t make it.",
    "I’m unavailable.",
    "No.",
  ],
};

const ESCALATION_ORDER: Tone[] = [
  "kind",
  "firm",
  "noDetails",
];

const HARD_BOUNDARIES = [
  "I’ve already answered. Please stop asking.",
  "I’m not going to discuss this further.",
  "This conversation is closed.",
];

export function generateExcuse(tone: Tone) {
  return pick(BANK[tone]);
}

export function escalate(level: number) {
  if (level < ESCALATION_ORDER.length) {
    return generateExcuse(ESCALATION_ORDER[level]);
  }
  return pick(HARD_BOUNDARIES);
}
