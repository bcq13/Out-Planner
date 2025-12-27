export type Audience = "work" | "friends" | "family";

const BANK = {
  work: {
    base: [
      "I’m not able to make it due to a scheduling conflict.",
      "Something came up and I need to move this.",
      "I need to step away to handle a time-sensitive item.",
      "I’m at capacity today and can’t give this my best attention.",
    ],
    funny: [
      "My calendar and I had a disagreement — the calendar won.",
      "I overbooked myself like it was an Olympic sport.",
      "I can’t make it — today’s schedule is doing the most.",
      "I’m going to need to reschedule before my brain files a complaint.",
    ],
    closer: [
      "Can we move it to {ALT1} or {ALT2}?",
      "Happy to reschedule for {ALT1}.",
      "Could we push to {ALT2}?",
      "Please send notes and I’ll follow up.",
    ],
  },
  friends: {
    base: [
      "I can’t make it tonight, but I hope y’all have fun.",
      "I’m going to have to rain-check.",
      "I’m wiped — I need a low-key night.",
      "Something came up and I’m out for tonight.",
    ],
    funny: [
      "My couch and I have plans that I can’t break.",
      "I’m socially tapped out… like 1% battery.",
      "I’m in my ‘do nothing’ era for the evening.",
      "I promised myself I wouldn’t overcommit… and I was right to.",
    ],
    closer: [
      "Can we do {ALT1} instead?",
      "Let’s try {ALT2}?",
      "I’m in for {ALT1} though!",
      "Rain check soon — I mean it.",
    ],
  },
  family: {
    base: [
      "I can’t make it this time, but I’m thinking of you.",
      "I’ve got a conflict that day, I’m sorry.",
      "I need to stay in and rest, but let’s plan another time.",
      "I can’t be there, but I love you and hope it goes great.",
    ],
    funny: [
      "I’m running on low energy and high responsibility.",
      "My week caught up to me and it brought receipts.",
      "I’m at my limit for plans — but not for loving y’all.",
      "I need to be a homebody tonight for medical reasons (tiredness).",
    ],
    closer: [
      "Can we do {ALT1} instead?",
      "I can do {ALT2}.",
      "Let’s plan something next week.",
      "Can you save me leftovers? 🙂",
    ],
  },
} as const;

const BOUNDARY_BANK: Record<Audience, string[]> = {
  work: [
    "I’m not available at that time.",
    "That doesn’t work for me.",
    "I won’t be able to take that on.",
    "Please send details and I’ll follow up when I can.",
  ],
  friends: [
    "I’m going to pass this time.",
    "Not tonight—rain check soon.",
    "I’m not up for it, but thank you.",
    "I’m staying in tonight.",
  ],
  family: [
    "I can’t make it this time.",
    "That won’t work for me.",
    "I’m not available, but I love you.",
    "I’m going to sit this one out.",
  ],
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function altTimes(date: Date): { ALT1: string; ALT2: string } {
  const d1 = new Date(date);
  d1.setDate(d1.getDate() + 2);
  const d2 = new Date(date);
  d2.setDate(d2.getDate() + 5);

  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return { ALT1: fmt(d1), ALT2: fmt(d2) };
}

export function generateExcuse(opts: {
  audience: Audience;
  funLevel: number;
  date: Date;
}): string {
  const { audience, funLevel, date } = opts;
  const bank = BANK[audience];

  const baseChance = funLevel === 0 ? 1 : funLevel === 1 ? 0.65 : funLevel === 2 ? 0.45 : 0.3;
  const useBase = Math.random() < baseChance;

  const line1 = useBase ? pick(bank.base) : pick(bank.funny);

  const closerChance = funLevel === 0 ? 0.4 : funLevel === 1 ? 0.6 : funLevel === 2 ? 0.75 : 0.85;

  let text = line1 as string;
  if (Math.random() < closerChance) {
    const { ALT1, ALT2 } = altTimes(date);
    const closer = pick(bank.closer).replace("{ALT1}", ALT1).replace("{ALT2}", ALT2);
    text = `${line1} ${closer}`;
  }

  if (audience === "work" && funLevel >= 2) {
    text = text.replace("🙂", "");
  }

  return text;
}

export function generateBoundaryScript(audience: Audience, funLevel: number): string {
  const line = pick(BOUNDARY_BANK[audience]);
  if (funLevel >= 3 && audience !== "work") return `${line} (No extra details.)`;
  return line;
}

export function rewriteVariant(
  text: string,
  variant: "shorter" | "firmer" | "workSafe" | "noDetails" | "reschedule",
  date: Date
): string {
  const t = text.trim();

  if (variant === "shorter") {
    const first = t.split(/[.!?]/).filter(Boolean)[0];
    return first ? `${first}.` : t;
  }
  if (variant === "noDetails") return "I’m not able to make it. Thanks for understanding.";
  if (variant === "workSafe")
    return "I’m not able to make it at that time. Please send notes and I’ll follow up.";
  if (variant === "firmer") return "I can’t make it. I’m not able to change that.";
  if (variant === "reschedule") {
    const { ALT1, ALT2 } = altTimes(date);
    return `I can’t make it. Could we do ${ALT1} or ${ALT2} instead?`;
  }
  return t;
}
