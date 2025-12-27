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

function normalize(s: string) {
  return (s || "").trim().replace(/\s+/g, " ");
}

/** Deterministic seeded RNG for “different every time” without needing external APIs */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rnd: () => number) {
  return arr[Math.floor(rnd() * arr.length)];
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function classifyRequest(req: string) {
  const r = (req || "").toLowerCase();
  if (!r) return "general" as const;

  if (/(babysit|watch (the )?kids|pick ?up|drop ?off|carpool|ride)/.test(r)) return "kids";
  if (/(loan|borrow|money|venmo|cash|pay for|cover this|spot me|co-?sign)/.test(r)) return "money";
  if (/(party|hang|dinner|lunch|coffee|drinks|come over|game night|invite|concert|happy hour)/.test(r)) return "social";
  if (/(meeting|call|zoom|presentation|deadline|cover|shift|schedule|report|review|ticket|on[- ]?call)/.test(r)) return "work";
  if (/(help move|moving|lift|truck|furniture|boxes|haul|dump run)/.test(r)) return "moving";
  if (/(volunteer|serve|church|team|sign up|help out|setup|tear ?down|childcare)/.test(r)) return "volunteer";

  return "general" as const;
}

function reasonByType(type: ReturnType<typeof classifyRequest>, audience: Audience, rnd: () => number) {
  const schedule = [
    "my schedule is already committed",
    "I’ve already got something booked",
    "I’m not free in that window",
    "I’ve got a hard stop and can’t fit it in",
  ];
  const bandwidth = [
    "I’m at capacity and need to protect my bandwidth",
    "I’m keeping my load realistic this week",
    "I’m tapped out and need to regroup",
    "I’m prioritizing rest and focus right now",
  ];
  const family = [
    "I’ve got a family commitment",
    "I’m on family duty",
    "I’ve got something I need to handle at home",
    "I’m committed elsewhere with family stuff",
  ];
  const logistics = [
    "the timing won’t work for me",
    "I can’t make the logistics line up",
    "I can’t pull that off today",
    "I’m not able to fit that in",
  ];

  switch (type) {
    case "work":
      return audience === "work" ? pick(schedule, rnd) : pick(bandwidth, rnd);
    case "money":
      return pick(
        [
          "I don’t do loans — it keeps relationships healthy",
          "I’m not able to help financially",
          "I keep money boundaries so friendships stay easy",
          "I can’t support that financially",
        ],
        rnd
      );
    case "moving":
      return pick(bandwidth, rnd);
    case "kids":
      return pick(family, rnd);
    case "volunteer":
      return pick(bandwidth, rnd);
    case "social":
      return pick(
        [
          "I’m keeping tonight low-key",
          "I’m laying low and recharging",
          "I’m not doing plans tonight",
          "I’m taking a quiet night",
        ],
        rnd
      );
    default:
      return pick(logistics, rnd);
  }
}

/** Optional “people ask too much” reflective closers */
const CLOSERS: Record<Mood, string[]> = {
  kind: [
    "I’m trying to keep my commitments realistic.",
    "I’m practicing saying no so I can show up well to what I’ve already said yes to.",
    "I’m working on healthier boundaries — thanks for understanding.",
    "I’m protecting my time a little better these days.",
  ],
  professional: [
    "I’m managing workload and priorities carefully right now.",
    "I’m keeping commitments aligned with capacity.",
    "I’m protecting focus time this week.",
    "I’m maintaining a sustainable workload.",
  ],
  funny: [
    "I’m not accepting new side quests right now.",
    "My calendar is not an all-you-can-eat buffet.",
    "I’m currently at maximum adult capacity.",
    "If I say yes, I’ll need a tiny assistant and a bigger life.",
  ],
  standup: [
    "If I say yes to everything, I become a subscription service.",
    "At some point, ‘helping’ becomes a second job with zero benefits.",
    "It’s amazing how one ‘yes’ turns into an ongoing expectation.",
    "People really will ask for a mile when you once offered an inch.",
  ],
  spicy: ["I’m not available for that.", "That’s not going to work.", "No."],
  firm: ["Please respect my decision.", "My answer isn’t changing.", "No means no."],
  noDetails: ["", "", ""],
};

function maybeAddCloser(text: string, mood: Mood, makeThemThink: boolean, rnd: () => number) {
  if (!makeThemThink) return text;
  if (mood === "noDetails") return text;
  const closer = pick(CLOSERS[mood], rnd);
  if (!closer) return text;
  return `${text} ${closer}`.trim();
}

/** Openers/outs/offers — deliberately never reference the request text */
const OPENERS: Record<Mood, string[]> = {
  kind: [
    "Thanks for asking.",
    "I appreciate you thinking of me.",
    "That’s kind of you to ask.",
    "I get it.",
    "Totally understand.",
  ],
  professional: ["Thanks for the message.", "Understood.", "Appreciate the note.", "Got it.", "Thanks for checking."],
  funny: ["Here’s the thing…", "Not to be dramatic, but…", "I would, but…", "Respectfully…", "Okay so…"],
  standup: [
    "So I looked at my calendar.",
    "I did the math.",
    "I admire the confidence in that ask.",
    "I love the optimism.",
    "Here’s what’s funny about this…",
  ],
  spicy: ["Nope.", "Nah.", "Hard pass.", "Not today.", "I’m out."],
  firm: ["No.", "I can’t.", "I’m not available.", "That won’t work.", "I’m saying no."],
  noDetails: ["No.", "I can’t.", "Not available.", "Can’t do it.", "No."],
};

const OUTS: Record<Mood, string[]> = {
  kind: ["I can’t this time.", "I’m not able to.", "I have to pass.", "I can’t commit to that.", "I won’t be able to."],
  professional: [
    "I’m unavailable.",
    "I’m unable to accommodate that.",
    "I have a scheduling conflict.",
    "I can’t take that on right now.",
    "I won’t be able to participate.",
  ],
  funny: [
    "My schedule says no.",
    "My social battery is on 2%.",
    "I’m at full capacity.",
    "I have a prior commitment to peace and quiet.",
    "I’m booked with… existing.",
  ],
  standup: [
    "I can’t — I only have one body and it’s already booked.",
    "I can’t — I’m trying this new thing called “not overcommitting.”",
    "I can’t — I’m avoiding turning my life into an unpaid internship.",
    "I can’t — I’m not taking on new side quests this week.",
    "I can’t — I’d say yes, then resent the concept of time.",
  ],
  spicy: ["No thanks.", "Not happening.", "Pass.", "Nope.", "I’m opting out."],
  firm: ["I’m not available.", "That doesn’t work for me.", "I won’t be doing that.", "No.", "I’m saying no."],
  noDetails: ["No.", "I can’t.", "Not available.", "No."],
};

const OFFERS: Record<Mood, string[]> = {
  kind: ["Maybe another time.", "I hope it goes well though.", "Thanks for understanding.", "I’m cheering you on.", ""],
  professional: ["Thanks for understanding.", "Please proceed without me.", "I can revisit another time.", "", ""],
  funny: [
    "I support you emotionally from a safe distance.",
    "I’ll be there in spirit. Far away. Quietly.",
    "I believe in you. From my couch.",
    "I’m sending good vibes and zero availability.",
    "",
  ],
  standup: [
    "I support the vision; I do not support the schedule.",
    "I’m cheering for you. From a healthy boundary.",
    "I believe in you — I’m just not available for the sequel.",
    "",
    "",
  ],
  spicy: ["Good luck.", "Hope it works out.", "", "", ""],
  firm: ["Thanks for understanding.", "Please respect that.", "That’s my final answer.", "", ""],
  noDetails: ["", "", "", "", ""],
};

export function generateExcuse(mood: Mood, makeThemThink = false, seed = Date.now()) {
  const rnd = mulberry32(seed ^ 0x9e3779b9);

  const base = [pick(OPENERS[mood], rnd), pick(OUTS[mood], rnd), pick(OFFERS[mood], rnd)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return maybeAddCloser(base, mood, makeThemThink, rnd);
}

/**
 * Generate a response to a request WITHOUT quoting it back.
 * We only use the request internally to choose a reason/type.
 */
export function generateFromRequest(opts: {
  mood: Mood;
  audience: Audience;
  request: string;
  makeThemThink?: boolean;
  seed?: number;
}) {
  const request = normalize(opts.request);
  const seedBase =
    (opts.seed ?? Date.now()) ^
    hashString(request) ^
    hashString(opts.mood) ^
    hashString(opts.audience);

  const rnd = mulberry32(seedBase);
  const type = classifyRequest(request);
  const reason = reasonByType(type, opts.audience, rnd);

  // Diverse structures (none echo the request)
  const structures: Record<Mood, (() => string)[]> = {
    kind: [
      () => `${pick(OPENERS.kind, rnd)} ${pick(OUTS.kind, rnd)} — ${reason}. ${pick(OFFERS.kind, rnd)}`.trim(),
      () => `${pick(OUTS.kind, rnd)} because ${reason}. ${pick(OFFERS.kind, rnd)}`.trim(),
      () => `${pick(OPENERS.kind, rnd)} I’d love to help, but ${reason}. ${pick(OUTS.kind, rnd)}`.trim(),
      () => `${pick(OUTS.kind, rnd)} — ${reason}.`.trim(),
    ],
    professional: [
      () => `${pick(OPENERS.professional, rnd)} ${pick(OUTS.professional, rnd)} due to a scheduling conflict.`.trim(),
      () => `${pick(OUTS.professional, rnd)} — ${reason}. ${pick(OFFERS.professional, rnd)}`.trim(),
      () => `At this time, ${pick(OUTS.professional, rnd)}. ${pick(OFFERS.professional, rnd)}`.trim(),
      () => `I’m not able to support this right now — ${reason}.`.trim(),
    ],
    funny: [
      () => `${pick(OPENERS.funny, rnd)} ${pick(OUTS.funny, rnd)} — ${reason}. ${pick(OFFERS.funny, rnd)}`.trim(),
      () => `${pick(OUTS.funny, rnd)}. It’s not you — it’s my capacity.`.trim(),
      () => `${pick(OUTS.funny, rnd)} — ${reason}. My calendar just blinked twice and backed away.`.trim(),
      () => `${pick(OPENERS.funny, rnd)} ${pick(OUTS.funny, rnd)}. ${pick(OFFERS.funny, rnd)}`.trim(),
    ],
    standup: [
      () => `${pick(OPENERS.standup, rnd)} ${pick(OUTS.standup, rnd)} — ${reason}. ${pick(OFFERS.standup, rnd)}`.trim(),
      () => `Not this time — ${reason}. If I say yes, we’ll both pretend it’s “quick” and then lose an afternoon.`.trim(),
      () => `${pick(OUTS.standup, rnd)}. I’m keeping my life from becoming a second job.`.trim(),
      () => `${pick(OPENERS.standup, rnd)} ${pick(OUTS.standup, rnd)}.`.trim(),
    ],
    spicy: [
      () => `${pick(OUTS.spicy, rnd)}`.trim(),
      () => `No — that doesn’t work for me.`.trim(),
      () => `I’m out. ${pick(OFFERS.spicy, rnd)}`.trim(),
    ],
    firm: [
      () => `${pick(OUTS.firm, rnd)} ${reason}.`.trim(),
      () => `No — ${reason}.`.trim(),
      () => `I won’t be doing that. Please respect that.`.trim(),
    ],
    noDetails: [
      () => `No.`,
      () => `I can’t.`,
      () => `Not available.`,
    ],
  };

  const base = pick(structures[opts.mood], rnd)();
  return maybeAddCloser(base, opts.mood, !!opts.makeThemThink, rnd);
}

export function escalateFromRequest(opts: {
  level: number;
  mood: Mood;
  audience: Audience;
  request: string;
  makeThemThink?: boolean;
  seed?: number;
}) {
  const seed = (opts.seed ?? Date.now()) ^ (opts.level * 101);
  const first = generateFromRequest({
    mood: opts.mood,
    audience: opts.audience,
    request: opts.request,
    makeThemThink: opts.makeThemThink,
    seed,
  });

  const ladder = [
    first,
    "I hear you — but my answer is still no.",
    "Still not available. Please respect that.",
    "I’m not discussing this further.",
    "I’ve said no. Please don’t ask again.",
  ];

  return ladder[Math.min(opts.level, ladder.length - 1)];
}

export function rewriteVariant(
  currentText: string,
  mood: Mood,
  audience: Audience,
  request: string,
  makeThemThink = false,
  seed = Date.now()
) {
  const req = normalize(request);
  if (req) return generateFromRequest({ mood, audience, request: req, makeThemThink, seed });
  return generateExcuse(mood, makeThemThink, seed ^ hashString(currentText));
}

export function generateUnique(getText: (seed: number) => string, last: string, seedBase: number, maxTries = 10) {
  const lastNorm = normalize(last);
  for (let i = 0; i < maxTries; i++) {
    const next = getText(seedBase + i * 9973);
    if (normalize(next) !== lastNorm) return next;
  }
  return getText(seedBase + 12345);
}

/** 200+ question library generated in-code */
function buildQuestionLibrary(): QuestionItem[] {
  const work = [
    "Can you hop on a quick call right now?",
    "Can you cover my shift on {DAY}?",
    "Can you take this task too? It’s small.",
    "Can you stay late today?",
    "Can you join this meeting last minute?",
    "Can you review this tonight?",
    "Can you jump in on this project?",
    "Can you take my on-call this weekend?",
  ];

  const social = [
    "Want to come over tonight?",
    "Can you make brunch on {DAY}?",
    "Can you come to my party this weekend?",
    "Can you go out after work?",
    "Want to grab coffee this week?",
    "Can you join us for dinner?",
    "Want to do something spontaneous tonight?",
  ];

  const family = [
    "Can you babysit this weekend?",
    "Can you help with something today?",
    "Can you pick up the kids?",
    "Can you come by for dinner?",
    "Can you drive someone to an appointment?",
    "Can you watch the house/pets?",
  ];

  const money = [
    "Can you loan me some money?",
    "Can you spot me until payday?",
    "Can you co-sign for me?",
    "Can you Venmo me for this?",
    "Can you cover this bill this time?",
  ];

  const church = [
    "Can you volunteer this Sunday?",
    "Can you help with setup and teardown?",
    "Can you serve on the team this month?",
    "Can you cover my volunteer slot on {DAY}?",
    "Can you bring food for everyone?",
  ];

  const moving = [
    "Can you help me move this weekend?",
    "Can you pick something up for me?",
    "Can you lend me your truck?",
    "Can you help me lift a couch?",
    "Can you run to the store for me?",
  ];

  const random = [
    "Can you do me a huge favor… real quick?",
    "Can you come through for me?",
    "Can I ask you something kinda big?",
    "Can you make an exception just this once?",
    "Can you help, like, immediately?",
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const times = ["tonight", "tomorrow", "this weekend", "next week", "after work", "this afternoon"];
  const modifiers = [
    "It’ll only take 5 minutes.",
    "It’s super quick.",
    "You’re the only person I trust for this.",
    "I really need you.",
    "I’ll owe you one.",
    "It would mean a lot.",
  ];

  const buckets: Array<[QuestionItem["category"], string[]]> = [
    ["Work", work],
    ["Social", social],
    ["Family", family],
    ["Money", money],
    ["Church/Volunteer", church],
    ["Moving/Errands", moving],
    ["Random", random],
  ];

  const out: QuestionItem[] = [];
  let id = 1;

  for (const [cat, baseList] of buckets) {
    for (const q of baseList) {
      out.push({ id: `${cat[0].toLowerCase()}${id++}`, category: cat, question: q.replace("{DAY}", "Friday") });

      for (const day of days) {
        out.push({ id: `${cat[0].toLowerCase()}${id++}`, category: cat, question: q.replace("{DAY}", day) });
      }
      for (const t of times) {
        out.push({
          id: `${cat[0].toLowerCase()}${id++}`,
          category: cat,
          question: `${q.replace("{DAY}", "Friday")} ${t}?`,
        });
      }
      for (const mod of modifiers) {
        out.push({
          id: `${cat[0].toLowerCase()}${id++}`,
          category: cat,
          question: `${q.replace("{DAY}", "Friday")} ${mod}`,
        });
      }
    }
  }

  const seen = new Set<string>();
  const cleaned: QuestionItem[] = [];

  for (const item of out) {
    const text = normalize(item.question);
    if (text.length < 12 || text.length > 140) continue;
    const key = item.category + "::" + text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push({ ...item, question: text });
  }

  // guarantee 200+
  while (cleaned.length < 220) {
    cleaned.push({
      id: `x${cleaned.length + 1}`,
      category: "Random",
      question: `Can you help me with something ${cleaned.length % 2 ? "today" : "this week"}?`,
    });
  }

  return cleaned;
}

export const QUESTION_LIBRARY: QuestionItem[] = buildQuestionLibrary();
