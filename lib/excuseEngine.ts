export type Audience = "work" | "friends" | "family";

export type Mood =
  | "kind"
  | "professional"
  | "funny"
  | "standup"
  | "spicy"
  | "firm"
  | "noDetails";

export type QuestionItem = {
  id: string;
  category:
    | "Work"
    | "Social"
    | "Family"
    | "Money"
    | "Church/Volunteer"
    | "Moving/Errands"
    | "Random";
  question: string;
};

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

function leadInForRequest(req: string) {
  const r = normalize(req);
  if (!r) return "";
  return `About “${r}”: `;
}

/** “Make them think” closers */
const PEOPLE_ASK_TOO_MUCH: Record<Mood, string[]> = {
  kind: [
    "I’m trying to keep my commitments realistic.",
    "I’m learning to protect my time a little better.",
    "I’m practicing saying no so I can show up well to what I’ve already said yes to.",
  ],
  professional: [
    "I’m managing workload and priorities carefully right now.",
    "I’m keeping my commitments aligned with capacity.",
    "I’m protecting focus time this week.",
  ],
  funny: [
    "I’m not accepting new side quests right now.",
    "My calendar is not an all-you-can-eat buffet.",
    "I’m currently at maximum adult capacity.",
  ],
  standup: [
    "If I say yes to everything, I become a subscription service.",
    "It’s wild how ‘Can you help?’ sometimes means ‘Can you adopt my responsibilities?’",
    "People really will ask for a mile when you once offered an inch—respectfully, I’m not a highway.",
  ],
  spicy: ["I’m not available for that.", "That’s not going to work.", "No."],
  firm: ["I’m not changing my answer.", "Please respect my decision.", "My answer is no."],
  noDetails: ["No.", "I can’t.", "Not happening."],
};

function maybeAddCloser(text: string, mood: Mood, makeThemThink: boolean) {
  if (!makeThemThink) return text;
  if (mood === "noDetails") return text;
  const closer = pick(PEOPLE_ASK_TOO_MUCH[mood]);
  return `${text} ${closer}`;
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
  standup: [
    "I can’t, and it’s not personal — it’s math. I only have one body and it’s already booked.",
    "I would, but I’m currently at maximum adult capacity. Any additional tasks will void the warranty.",
    "I can’t — I’m trying this new thing where I don’t overcommit and then quietly resent everyone.",
    "I’m going to pass. I’ve realized being available is how people accidentally assign you a second job.",
    "I can’t, but I respect the confidence it took to ask.",
    "I’m unavailable. My time isn’t unlimited — it just looks unlimited to other people.",
  ],
  spicy: ["No thanks.", "Hard pass.", "I’m opting out.", "Not happening."],
  firm: ["I’m not available.", "That doesn’t work for me.", "I’m saying no.", "I won’t be doing that."],
  noDetails: ["I can’t.", "I’m unavailable.", "No.", "Not this time."],
};

export function generateExcuse(mood: Mood, makeThemThink = false) {
  const base = pick(GENERIC[mood]);
  return maybeAddCloser(base, mood, makeThemThink);
}

export function generateFromRequest(opts: {
  mood: Mood;
  audience: Audience;
  request: string;
  makeThemThink?: boolean;
}) {
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
    noDetails: [`${lead}I can’t.`, `${lead}I’m unavailable.`, `${lead}No.`],
  };

  const base = pick(templates[opts.mood]);
  return maybeAddCloser(base, opts.mood, !!opts.makeThemThink);
}

/** Contextual escalation */
export function escalateFromRequest(opts: {
  level: number;
  mood: Mood;
  audience: Audience;
  request: string;
  makeThemThink?: boolean;
}) {
  const request = normalize(opts.request);
  const type = classifyRequest(request);
  const reason = reasonByType(type, opts.audience);
  const lead = leadInForRequest(request);

  const first = generateFromRequest({
    mood: opts.mood,
    audience: opts.audience,
    request: opts.request,
    makeThemThink: opts.makeThemThink,
  });

  const ladder = [
    first,
    `${lead}I hear you — I’m still not able to. ${reason}.`,
    `${lead}My answer is still no. Please respect that.`,
    `${lead}I’m not discussing this further.`,
    `${lead}I’ve said no. Please don’t ask again.`,
  ];

  const idx = Math.min(opts.level, ladder.length - 1);
  return ladder[idx];
}

/** Rewrite variants: just regenerate in the target mood */
export function rewriteVariant(
  _text: string,
  mood: Mood,
  audience: Audience,
  request: string,
  makeThemThink = false
) {
  if (normalize(request)) return generateFromRequest({ mood, audience, request, makeThemThink });
  return generateExcuse(mood, makeThemThink);
}

/** Guarantee "new response" by retrying a few times if we get the same output */
export function generateUnique(getText: () => string, last: string, maxTries = 8) {
  const lastNorm = normalize(last);
  for (let i = 0; i < maxTries; i++) {
    const next = getText();
    if (normalize(next) !== lastNorm) return next;
  }
  return getText();
}

/** Question Library (long list) */
export const QUESTION_LIBRARY: QuestionItem[] = [
  // Work
  { id: "w1", category: "Work", question: "Can you hop on a quick call right now?" },
  { id: "w2", category: "Work", question: "Can you cover my shift Friday?" },
  { id: "w3", category: "Work", question: "Can you take this task too? It’s small." },
  { id: "w4", category: "Work", question: "Can you stay late today?" },
  { id: "w5", category: "Work", question: "Can you join this meeting last minute?" },
  { id: "w6", category: "Work", question: "Can you review this tonight?" },

  // Social
  { id: "s1", category: "Social", question: "Want to come over tonight?" },
  { id: "s2", category: "Social", question: "Can you make it to brunch tomorrow?" },
  { id: "s3", category: "Social", question: "Can you come to my party this weekend?" },
  { id: "s4", category: "Social", question: "Can you go out after work?" },
  { id: "s5", category: "Social", question: "Can you drive us?" },

  // Family
  { id: "f1", category: "Family", question: "Can you babysit this weekend?" },
  { id: "f2", category: "Family", question: "Can you come help with something today?" },
  { id: "f3", category: "Family", question: "Can you pick up the kids?" },
  { id: "f4", category: "Family", question: "Can you come by for dinner?" },

  // Money
  { id: "m1", category: "Money", question: "Can you loan me some money?" },
  { id: "m2", category: "Money", question: "Can you spot me until payday?" },
  { id: "m3", category: "Money", question: "Can you co-sign for me?" },

  // Church/Volunteer
  { id: "c1", category: "Church/Volunteer", question: "Can you volunteer this Sunday?" },
  { id: "c2", category: "Church/Volunteer", question: "Can you lead this thing? You’d be great." },
  { id: "c3", category: "Church/Volunteer", question: "Can you help with setup and teardown?" },

  // Moving/Errands
  { id: "e1", category: "Moving/Errands", question: "Can you help me move this weekend?" },
  { id: "e2", category: "Moving/Errands", question: "Can you pick something up for me?" },
  { id: "e3", category: "Moving/Errands", question: "Can you lend me your truck?" },

  // Random
  { id: "r1", category: "Random", question: "Can you do me a huge favor… real quick?" },
  { id: "r2", category: "Random", question: "Can you come through for me?" },
  { id: "r3", category: "Random", question: "Can I ask you something kinda big?" },
];
