export type Audience = "work" | "friends" | "family";

export type Mood =
  | "kind"
  | "professional"
  | "funny"
  | "standup"
  | "spicy"
  | "firm"
  | "noDetails";

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function normalize(s: string) {
  return (s || "").trim().replace(/\s+/g, " ");
}

function classifyRequest(req: string) {
  const r = req.toLowerCase();
  if (!r) return "general" as const;

  if (/(babysit|watch (the )?kids|pickup|drop ?off|ride|carpool)/.test(r)) return "kids";
  if (/(loan|borrow|money|venmo|cash|pay for|cover this)/.test(r)) return "money";
  if (/(party|hang|dinner|lunch|coffee|drinks|come over|game night|invite)/.test(r)) return "social";
  if (/(meeting|call|zoom|presentation|deadline|cover|shift|schedule|report|review)/.test(r)) return "work";
  if (/(help move|moving|lift|truck|furniture|boxes)/.test(r)) return "moving";
  if (/(volunteer|serve|church|team|sign up|help out)/.test(r)) return "volunteer";
  return "general" as const;
}

function reasonByType(type: ReturnType<typeof classifyRequest>, audience: Audience) {
  // Believable reasons that don’t require lies, illness, or drama.
  const base = {
    schedule: "my schedule’s already committed",
    bandwidth: "I’m at capacity and need to protect my bandwidth",
    family: "I’ve got a family commitment",
    logistics: "it doesn’t work with my timing/logistics",
  };

  switch (type) {
    case "work":
      return audience === "work" ? "I’m already booked during that window" : base.schedule;
    case "money":
      return "I don’t lend money — it keeps relationships healthy";
    case "moving":
      return base.bandwidth;
    case "kids":
      return base.family;
    case "volunteer":
      return base.bandwidth;
    case "social":
      return "I’m keeping tonight low-key";
    default:
      return base.logistics;
  }
}

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
  // Clean, observational humor — “makes people think” vibe
  standup: [
    "I can’t, and it’s not personal — it’s math. I only have one body and it’s already booked.",
    "I would, but I’m currently at maximum adult capacity. Any additional tasks will void the warranty.",
    "I can’t — I’m trying this new thing where I don’t overcommit and then quietly resent everyone.",
    "I’m going to pass. I’ve realized being available is how people accidentally assign you a second job.",
    "I can’t, but I respect the confidence it took to ask.",
    "I’m unavailable. My time isn’t unlimited — it just *looks* unlimited to other people.",
    "I can’t. If I say yes to everything, I’m basically a subscription service.",
    "Not today. I’m returning to my natural habitat: minding my own business.",
    "I can’t — I’m in a committed relationship with my calendar.",
    "I’m going to say no. I’m practicing boundaries like they’re a new hobby.",
  ],
  spicy: ["No thanks.", "Hard pass.", "I’m opting out.", "Not happening."],
  firm: [
    "I’m not available.",
    "That doesn’t work for me.",
    "I’m saying no.",
    "I won’t be doing that.",
  ],
  noDetails: ["I can’t.", "I’m unavailable.", "No.", "Not this time."],
};

function leadInForRequest(req: string) {
  const r = normalize(req);
  if (!r) return "";
  return `About “${r}”: `;
}

export function generateExcuse(mood: Mood) {
  return pick(GENERIC[mood]);
}

export function generateFromRequest(opts: { mood: Mood; audience: Audience; request: string }) {
  const request = normalize(opts.request);
  const type = classifyRequest(request);
  const reason = reasonByType(type, opts.audience);
  const lead = leadInForRequest(request);

  const templates: Record<Mood, string[]> = {
    kind: [
      `${lead}Thanks for asking — I can’t, because ${reason}. I hope it goes well though.`,
      `${lead}I’m going to pass — ${reason}. Thanks for understanding.`,
    ],
    professional: [
      `${lead}I’m unable to accommodate this due to a scheduling conflict.`,
      `${lead}I’m not available for this at that time.`,
      `${lead}I’m at capacity and won’t be able to take this on.`,
    ],
    funny: [
      `${lead}I can’t — ${reason}. My calendar is currently allergic to extra plans.`,
      `${lead}I’m out — ${reason}. I’m trying to avoid becoming a full-time favor employee.`,
    ],
    standup: [
      `${lead}I can’t — ${reason}. Also, I’ve noticed when you say yes once, people act like you signed a multi-year contract.`,
      `${lead}I’m going to pass — ${reason}. I’m learning that “available” is how you get assigned bonus responsibilities.`,
      `${lead}I can’t — ${reason}. I respect the ask, but I’m not accepting new side quests right now.`,
      `${lead}Not today — ${reason}. If I say yes to everything, I’ll need to start billing hourly.`,
    ],
    spicy: [
      `${lead}No — that doesn’t work for me.`,
      `${lead}Not happening.`,
      `${lead}No thanks.`,
    ],
    firm: [
      `${lead}I can’t do that — ${reason}.`,
      `${lead}I’m not available — ${reason}.`,
      `${lead}That won’t work for me.`,
    ],
    noDetails: [
      `${lead}I can’t.`,
      `${lead}I’m unavailable.`,
      `${lead}No.`,
    ],
  };

  return pick(templates[opts.mood]);
}

// Contextual escalation: references the request, gets firmer each time.
export function escalateFromRequest(opts: { level: number; mood: Mood; audience: Audience; request: string }) {
  const request = normalize(opts.request);
  const lead = leadInForRequest(request);
  const type = classifyRequest(request);
  const reason = reasonByType(type, opts.audience);

  const level0 = generateFromRequest(opts); // first response is mood-based
  const ladder = [
    level0,
    `${lead}I hear you — I’m still not able to. ${reason}.`,
    `${lead}My answer is still no. Please respect that.`,
    `${lead}I’m not discussing this further.`,
    `${lead}I’ve said no. Please don’t ask again.`,
  ];

  const idx = Math.min(opts.level, ladder.length - 1);
  return ladder[idx];
}

export function rewriteVariant(_text: string, mood: Mood, audience: Audience, request: string) {
  if (normalize(request)) return generateFromRequest({ mood, audience, request });
  return generateExcuse(mood);
}
