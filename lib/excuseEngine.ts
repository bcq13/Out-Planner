export type Audience = "work" | "friends" | "family";
export type Tone =
  | "kind"
  | "professional"
  | "funny"
  | "spicy"
  | "firm"
  | "workSafe"
  | "noDetails"
  | "reschedule";

const excuseBank: Record<Tone, string[]> = {
  kind: [
    "I won’t be able to make it, but I really appreciate the invite.",
    "I need to sit this one out — thank you for understanding.",
    "I’m going to pass today, but I hope it goes great.",
    "I’m not able to join, but I’m grateful you thought of me.",
    "I need a quiet day — thanks for the grace.",
  ],

  professional: [
    "I’m unavailable due to a scheduling conflict.",
    "I won’t be able to attend as planned.",
    "I need to decline due to prior commitments.",
    "I’m unable to participate at this time.",
    "I’ll need to pass on this one.",
  ],

  funny: [
    "My calendar and I are no longer on speaking terms.",
    "I have reached my daily quota of human interaction.",
    "Today is not a ‘people day’ for me.",
    "I have an unexpected appointment with my couch.",
    "I regret to inform you that I will be unavailable.",
  ],

  spicy: [
    "That’s a no for me today.",
    "I won’t be doing that.",
    "I’m out.",
    "Not happening, but thank you.",
    "I’m choosing rest instead.",
  ],

  firm: [
    "I’m not available.",
    "I won’t be attending.",
    "That doesn’t work for me.",
    "I’m saying no.",
    "I need to decline.",
  ],

  workSafe: [
    "I have a conflict and won’t be able to attend.",
    "I’ll need to step back from this.",
    "I’m unavailable at that time.",
    "I won’t be able to join today.",
    "I need to pass on this meeting.",
  ],

  noDetails: [
    "I can’t make it.",
    "I’m unavailable.",
    "Not today.",
    "I’ll need to pass.",
    "I’m not able to attend.",
  ],

  reschedule: [
    "I can’t make it today — can we reschedule?",
    "Today doesn’t work, but another time might.",
    "I’ll need to pass today; happy to reconnect later.",
    "Can we find another day?",
    "Let’s try for another time.",
  ],
};

const boundaryScripts = [
  "I’ve already answered — please respect that.",
  "I’m not changing my mind.",
  "I don’t owe an explanation.",
  "This conversation is closed.",
  "Please stop pushing.",
  "I’ve said no, and that’s final.",
  "I’m not available to discuss this further.",
];

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateExcuse(tone: Tone) {
  return pick(excuseBank[tone]);
}

export function rewriteVariant(text: string, mode: Tone) {
  // ignore original text, re-generate cleanly
  return generateExcuse(mode);
}

export function generateBoundaryScript() {
  return pick(boundaryScripts);
}

