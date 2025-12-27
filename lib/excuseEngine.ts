export type Audience = "work" | "friends" | "family";

export type Mood =
  | "kind"
  | "professional"
  | "funny"
  | "spicy"
  | "firm"
  | "noDetails";

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const GENERIC: Record<Mood, string[]> = {
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
    "I’m at capacity and can’t take this on right now.",
  ],
  funny: [
    "My calendar said absolutely not.",
    "I have a prior commitment to doing nothing.",
    "Today is not a people day.",
    "My social battery is on 1%.",
  ],
  spicy: ["No thanks.", "Hard pass.", "I’m opting out.", "Not happening."],
  firm: [
    "I’m not available.",
    "That doesn’t work for me.",
    "I’m saying no.",
    "I won’t be doing that.",
  ],
  noDetails: ["I can’t make it.", "I’m unavailable.", "No.", "Not this time."],
};

const ESCALATION: (Mood | "boundary")[] = ["kind", "firm", "noDetails", "boundary"];

const BOUNDARY_SCRIPTS = [
  "I’ve already answered. Please stop asking.",
  "I’m not going to discuss this further.",
  "This conversation is closed.",
  "I’m not changing my mind.",
];

function normalize(s: string) {
  return (s || "").trim().replace(/\s+/g, " ");
}

function classifyRequest(req: string) {
  const r = req.toLowerCase();
  if (!r) return "general" as const;

  if (/(babysit|watch (the )?kids|pickup|drop ?off|ride|carpool)/.test(r)) return "favor_kids";
  if (/(loan|borrow|money|venmo|cash|pay for)/.test(r)) return "money";
  if (/(party|hang|dinner|lunch|coffee|drinks|come over|game night)/.test(r)) return "social";
  if (/(meeting|call|zoom|presentation|deadline|cover|shift|schedule)/.test(r)) return "work";
  if (/(help move|move( )?ing|搬|lift|truck|furniture)/.test(r)) return "moving";
  if (/(volunteer|serve|church|team|sign up)/.test(r)) return "volunteer";

  return "general" as const;
}

function reasonByType(type: ReturnType<typeof classifyRequest>, audience: Audience) {
  // short, believable reasons; avoids lying about illness/legal stuff
  const common = {
    schedule: "I already have something scheduled then.",
    bandwidth: "I’m maxed out this week and need to protect my bandwidth.",
    commitment: "I’ve got a prior commitment I can’t move.",
    family: "I have a family commitment I need to handle.",
    logistics: "That won’t work with my schedule/logistics.",
  };

  switch (type) {
    case "work":
      return audience === "work" ? common.schedule : common.commitment;
    case "money":
      return "I can’t lend money, but I hope you find a good solution.";
    case "moving":
      return common.bandwidth;
    case "favor_kids":
      return common.family;
    case "volunteer":
      return common.bandwidth;
    case "social":
      return common.schedule;
    default:
      return common.logistics;
  }
}

export function generateExcuse(mood: Mood) {
  return pick(GENERIC[mood]);
}

export function escalate(level: number) {
  const step = ESCALATION[Math.min(level, ESCALATION.length - 1)];
  if (step === "boundary") return pick(BOUNDARY_SCRIPTS);
  return generateExcuse(step);
}

export function generateFromRequest(opts: {
  mood: Mood;
  audience: Audience;
  request: string;
}) {
  const request = normalize(opts.request);
  const type = classifyRequest(request);
  const reason = reasonByType(type, opts.audience);

  const leadIn = request ? `About "${request}": ` : "";
  const softener =
    opts.mood === "kind"
      ? "Thanks for asking — "
      : opts.mood === "professional"
      ? ""
      : opts.mood === "funny"
      ? "I wish I could, but "
      : "";

  const moodTemplate: Record<Mood, string[]> = {
    kind: [
      `${leadIn}${softener}I can’t, ${reason} I hope it goes great though.`,
      `${leadIn}${softener}I’m going to pass — ${reason} Thanks for understanding.`,
    ],
    professional: [
      `${leadIn}I’m unable to accommodate this due to a scheduling conflict.`,
      `${leadIn}I’m not available for this at that time.`,
      `${leadIn}I’m at capacity and won’t be able to take this on.`,
    ],
    funny: [
      `${leadIn}${softener}${reason} Also, my calendar is in a committed relationship with “no.”`,
      `${leadIn}${softener}${reason} My future self asked me to say no.`,
    ],
    spicy: [
      `${leadIn}No — that doesn’t work for me.`,
      `${leadIn}Not happening.`,
      `${leadIn}No thanks.`,
    ],
    firm: [
      `${leadIn}I can’t do that. ${reason}`,
      `${leadIn}I’m not available. ${reason}`,
      `${leadIn}That won’t work for me.`,
    ],
    noDetails: [
      `${leadIn}I can’t.`,
      `${leadIn}I’m unavailable.`,
      `${leadIn}No.`,
    ],
  };

  return pick(moodTemplate[opts.mood]);
}

export function rewriteVariant(text: string, mood: Mood, audience: Audience, request: string) {
  // re-generate using the same request context (best UX)
  if (normalize(request)) return generateFromRequest({ mood, audience, request });
  // fallback: rewrite as a fresh one in that mood
  return generateExcuse(mood);
}
