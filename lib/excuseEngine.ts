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

/** Simple seeded RNG (deterministic variety) */
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
  const r = req.toLowerCase();
  if (!r) return "general" as const;

  if (/(babysit|watch (the )?kids|pickup|pick up|drop ?off|ride|carpool)/.test(r)) return "kids";
  if (/(loan|borrow|money|venmo|cash|pay for|cover this|spot me|co-?sign)/.test(r)) return "money";
  if (/(party|hang|dinner|lunch|coffee|drinks|come over|game night|invite|concert|bar)/.test(r)) return "social";
  if (/(meeting|call|zoom|presentation|deadline|cover|shift|schedule|report|review|ticket|on[- ]?call)/.test(r)) return "work";
  if (/(help move|moving|lift|truck|furniture|boxes|搬|move)/.test(r)) return "moving";
  if (/(volunteer|serve|church|team|sign up|help out|setup|tear ?down)/.test(r)) return "volunteer";

  return "general" as const;
}

function reasonByType(type: ReturnType<typeof classifyRequest>, audience: Audience, rnd: () => number) {
  const schedule = [
    "my schedule’s already committed",
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
    "it doesn’t work with my timing/logistics",
    "the timing won’t work for me",
    "I can’t make the timing line up",
    "I can’t pull that off with my schedule today",
  ];

  switch (type) {
    case "work":
      return audience === "work" ? pick(schedule, rnd) : pick(bandwidth, rnd);
    case "money":
      return pick(
        [
          "I don’t lend money — it keeps relationships healthy",
          "I’m not able to do loans or advances",
          "I keep money boundaries so friendships stay easy",
          "I can’t help financially, but I hope it works out",
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

function leadIn(req: string, rnd: () => number) {
  const r = normalize(req);
  if (!r) return "";
  return pick(
    [
      `About “${r}”: `,
      `Re: “${r}” — `,
      `On “${r}”: `,
      `Quick note on “${r}”: `,
      `On that — “${r}”: `,
    ],
    rnd
  );
}

/** Optional “people ask too much” closers */
const CLOSERS: Record<Mood, string[]> = {
  kind: [
    "I’m trying to keep my commitments realistic.",
    "I’m learning to protect my time a little better.",
    "I’m practicing saying no so I can show up well to what I’ve already said yes to.",
    "I’m working on healthier boundaries — thank you for understanding.",
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
    "It’s wild how ‘Can you help?’ sometimes means ‘Can you adopt my responsibilities?’",
    "People really will ask for a mile when you once offered an inch—respectfully, I’m not a highway.",
    "At some point ‘helping’ becomes a second job with zero benefits.",
  ],
  spicy: ["I’m not available for that.", "That’s not going to work.", "No."],
  firm: ["I’m not changing my answer.", "Please respect my decision.", "My answer is no."],
  noDetails: ["No.", "I can’t.", "Not happening."],
};

function maybeAddCloser(text: string, mood: Mood, makeThemThink: boolean, rnd: () => number) {
  if (!makeThemThink) return text;
  if (mood === "noDetails") return text;
  const closer = pick(CLOSERS[mood], rnd);
  return `${text} ${closer}`;
}

/** Highly varied building blocks */
const OPENERS: Record<Mood, string[]> = {
  kind: [
    "Thanks for asking.",
    "I appreciate you thinking of me.",
    "That’s kind of you to ask.",
    "I’m honored you asked.",
    "I get it.",
  ],
  professional: [
    "Thanks for the message.",
    "Understood.",
    "Thanks for checking.",
    "Appreciate the note.",
    "Got it.",
  ],
  funny: [
    "Okay so…",
    "Here’s the thing…",
    "Not to be dramatic, but…",
    "I would, but…",
    "Respectfully…",
  ],
  standup: [
    "So I looked at my calendar.",
    "I did the math.",
    "Here’s what’s funny about that.",
    "I love the optimism.",
    "I admire the confidence in that ask.",
  ],
  spicy: ["Nope.", "Nah.", "Hard pass.", "I’m out.", "Not today."],
  firm: ["No.", "I can’t.", "I’m not available.", "That won’t work.", "I’m saying no."],
  noDetails: ["No.", "I can’t.", "Not available.", "Can’t do it.", "No."],
};

const OUTS: Record<Mood, string[]> = {
  kind: [
    "I can’t this time.",
    "I’m not able to make that happen.",
    "I won’t be able to.",
    "I have to pass this time.",
    "I can’t commit to that.",
  ],
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
    "I’m currently booked with… existing.",
  ],
  standup: [
    "I can’t — I only have one body and it’s already booked.",
    "I would, but I’m trying this new thing called “not overcommitting.”",
    "I can’t — I’m avoiding turning my life into an unpaid internship.",
    "I can’t — I’m not taking on new side quests this week.",
    "I can’t — I’d say yes, then resent the concept of time.",
  ],
  spicy: ["No thanks.", "Not happening.", "I’m opting out.", "Pass.", "Nope."],
  firm: ["I’m not available.", "That doesn’t work for me.", "I won’t be doing that.", "I’m saying no.", "No."],
  noDetails: ["No.", "I can’t.", "Not available.", "No."],
};

const OFFERS: Record<Mood, string[]> = {
  kind: [
    "I hope it goes well though.",
    "I’m cheering you on from afar.",
    "I’m wishing you the best with it.",
    "Maybe another time.",
    "Thanks for understanding.",
  ],
  professional: [
    "Thanks for understanding.",
    "Please proceed without me.",
    "I appreciate your flexibility.",
    "I can revisit another time.",
    "Wishing you success with it.",
  ],
  funny: [
    "I support you emotionally from a safe distance.",
    "I’ll be there in spirit. Far away. Quietly.",
    "I believe in you. From my couch.",
    "I’m sending good vibes and zero availability.",
    "You’ve got this. I do not.",
  ],
  standup: [
    "You’ll crush it. I’ll be busy not creating a second job for myself.",
    "I support the vision; I do not support the schedule.",
    "I believe in you, but I’m not available for the sequel.",
    "I’m cheering for you. From a healthy boundary.",
    "I’m rooting for you—just not participating.",
  ],
  spicy: ["Good luck.", "Hope it works out.", "You’ll figure it out."],
  firm: ["Thanks for understanding.", "Please respect that.", "That’s my final answer."],
  noDetails: [""],
};

export function generateExcuse(mood: Mood, makeThemThink = false, seed = Date.now()) {
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const parts = [
    pick(OPENERS[mood], rnd),
    pick(OUTS[mood], rnd),
    pick(OFFERS[mood], rnd),
  ]
    .filter(Boolean)
    .join(" ");

  return maybeAddCloser(parts.trim(), mood, makeThemThink, rnd);
}

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
  const lead = leadIn(request, rnd);

  // More variety: a bunch of structures, not just one template set
  const structures: Record<Mood, ((lead: string) => string)[]> = {
    kind: [
      (l) => `${l}${pick(OPENERS.kind, rnd)} ${pick(OUTS.kind, rnd)} because ${reason}. ${pick(OFFERS.kind, rnd)}`,
      (l) => `${l}I’d love to help, but ${reason}. ${pick(OUTS.kind, rnd)}. ${pick(OFFERS.kind, rnd)}`,
      (l) => `${l}${pick(OUTS.kind, rnd)} — ${reason}. ${pick(OFFERS.kind, rnd)}`,
      (l) => `${l}Thanks for asking — ${reason}, so ${pick(OUTS.kind, rnd)}. ${pick(OFFERS.kind, rnd)}`,
    ],
    professional: [
      (l) => `${l}${pick(OPENERS.professional, rnd)} ${pick(OUTS.professional, rnd)} due to a scheduling conflict.`,
      (l) => `${l}${pick(OUTS.professional, rnd)} — ${reason}. ${pick(OFFERS.professional, rnd)}`,
      (l) => `${l}At this time, ${pick(OUTS.professional, rnd)}. ${pick(OFFERS.professional, rnd)}`,
      (l) => `${l}I’m not able to support this right now — ${reason}.`,
    ],
    funny: [
      (l) => `${l}${pick(OUTS.funny, rnd)} — ${reason}. ${pick(OFFERS.funny, rnd)}`,
      (l) => `${l}${pick(OPENERS.funny, rnd)} ${pick(OUTS.funny, rnd)}. ${pick(OFFERS.funny, rnd)}`,
      (l) => `${l}I can’t — ${reason}. My calendar just blinked twice and backed away slowly.`,
      (l) => `${l}${pick(OUTS.funny, rnd)}. It’s not you… it’s my capacity.`,
    ],
    standup: [
      (l) => `${l}${pick(OPENERS.standup, rnd)} ${pick(OUTS.standup, rnd)} — ${reason}. ${pick(OFFERS.standup, rnd)}`,
      (l) => `${l}I can’t — ${reason}. Also, it’s amazing how one ‘yes’ becomes a lifelong expectation.`,
      (l) => `${l}Not this time — ${reason}. If I say yes, we’ll both pretend it’s “quick” and then lose an afternoon.`,
      (l) => `${l}${pick(OUTS.standup, rnd)}. ${pick(OFFERS.standup, rnd)}`,
    ],
    spicy: [
      (l) => `${l}${pick(OUTS.spicy, rnd)}`,
      (l) => `${l}No — that doesn’t work for me.`,
      (l) => `${l}I’m out. ${pick(OFFERS.spicy, rnd)}`,
    ],
    firm: [
      (l) => `${l}${pick(OUTS.firm, rnd)} ${reason}.`,
      (l) => `${l}No — ${reason}.`,
      (l) => `${l}I won’t be doing that. Please respect that.`,
    ],
    noDetails: [
      (l) => `${l}No.`,
      (l) => `${l}I can’t.`,
      (l) => `${l}Not available.`,
    ],
  };

  const base = pick(structures[opts.mood], rnd)(lead).trim();
  return maybeAddCloser(base, opts.mood, !!opts.makeThemThink, rnd);
}

/** Escalation ladder: gets firmer each time */
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

  const req = normalize(opts.request);
  const lead = req ? `Re: “${req}” — ` : "";
  const ladder = [
    first,
    `${lead}I hear you — but my answer is still no.`,
    `${lead}Still not available. Please respect that.`,
    `${lead}I’m not discussing this further.`,
    `${lead}I’ve said no. Please don’t ask again.`,
  ];

  return ladder[Math.min(opts.level, ladder.length - 1)];
}

/** Rewrite: regenerate in mood with a new seed */
export function rewriteVariant(
  text: string,
  mood: Mood,
  audience: Audience,
  request: string,
  makeThemThink = false,
  seed = Date.now()
) {
  if (normalize(request)) return generateFromRequest({ mood, audience, request, makeThemThink, seed });
  return generateExcuse(mood, makeThemThink, seed ^ hashString(text));
}

/** Guarantee “different from last” by retrying with different seeds */
export function generateUnique(getText: (seed: number) => string, last: string, seedBase: number, maxTries = 10) {
  const lastNorm = normalize(last);
  for (let i = 0; i < maxTries; i++) {
    const next = getText(seedBase + i * 9973);
    if (normalize(next) !== lastNorm) return next;
  }
  return getText(seedBase + 12345);
}

/** Build a 200+ question library without pasting a giant file */
function buildQuestionLibrary(): QuestionItem[] {
  const categories: QuestionItem["category"][] = [
    "Work",
    "Social",
    "Family",
    "Money",
    "Church/Volunteer",
    "Moving/Errands",
    "Random",
  ];

  const work = [
    "Can you hop on a quick call right now?",
    "Can you cover my shift on {DAY}?",
    "Can you take this task too? It’s small.",
    "Can you stay late today?",
    "Can you join this meeting last minute?",
    "Can you review this tonight?",
    "Can you handle this client email for me?",
    "Can you jump in on this project?",
    "Can you take notes on the call?",
    "Can you build the deck for tomorrow?",
    "Can you troubleshoot this ASAP?",
    "Can you take my on-call this weekend?",
    "Can you switch shifts with me?",
    "Can you do a quick favor at work?",
    "Can you run this errand for the office?",
  ];

  const social = [
    "Want to come over tonight?",
    "Can you make brunch on {DAY}?",
    "Can you come to my party this weekend?",
    "Can you go out after work?",
    "Can you drive us?",
    "Can you come to my thing on {DAY}?",
    "Want to grab coffee this week?",
    "Can you join us for dinner?",
    "Can you come to the game?",
    "Can you help me celebrate something?",
    "Are you free later?",
    "Can you stay out late with us?",
    "Can you come to happy hour?",
    "Want to do something spontaneous tonight?",
  ];

  const family = [
    "Can you babysit this weekend?",
    "Can you help with something today?",
    "Can you pick up the kids?",
    "Can you come by for dinner?",
    "Can you help me run errands?",
    "Can you come over and help clean?",
    "Can you drive someone to an appointment?",
    "Can you watch the house/pets?",
    "Can you help me with a project at home?",
    "Can you do a quick pickup for me?",
    "Can you come early to help set up?",
    "Can you stay longer and help after?",
  ];

  const money = [
    "Can you loan me some money?",
    "Can you spot me until payday?",
    "Can you co-sign for me?",
    "Can you Venmo me for this?",
    "Can you cover this bill this time?",
    "Can you pay for my ticket and I’ll pay you back?",
    "Can you buy this and I’ll reimburse you?",
    "Can you lend me your credit card for a second?",
  ];

  const church = [
    "Can you volunteer this Sunday?",
    "Can you lead this thing? You’d be great.",
    "Can you help with setup and teardown?",
    "Can you serve on the team this month?",
    "Can you cover my volunteer slot on {DAY}?",
    "Can you host the group at your place?",
    "Can you bring food for everyone?",
    "Can you run sound/tech?",
    "Can you help with childcare?",
    "Can you do announcements?",
  ];

  const moving = [
    "Can you help me move this weekend?",
    "Can you pick something up for me?",
    "Can you lend me your truck?",
    "Can you help me lift a couch?",
    "Can you swing by and drop this off?",
    "Can you help me assemble furniture?",
    "Can you run to the store for me?",
    "Can you return something for me?",
    "Can you help me haul boxes?",
    "Can you help me do a dump run?",
  ];

  const random = [
    "Can you do me a huge favor… real quick?",
    "Can you come through for me?",
    "Can I ask you something kinda big?",
    "Can you help me with a complicated situation?",
    "Can you help me figure something out tonight?",
    "Can you be honest — can you do this for me?",
    "Can you make an exception just this once?",
    "Can you help, like, immediately?",
    "Can you take this off my plate?",
    "Can you say yes just this time?",
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const times = ["tonight", "tomorrow", "this weekend", "next week", "after work", "this afternoon", "first thing in the morning"];
  const modifiers = [
    "It’ll only take 5 minutes.",
    "It’s super quick.",
    "You’re the only person I trust for this.",
    "I really need you.",
    "Pleaseeee.",
    "I’m in a bind.",
    "I’ll owe you one.",
    "It would mean a lot.",
    "Don’t leave me hanging.",
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
      // base question
      out.push({ id: `${cat[0].toLowerCase()}${id++}`, category: cat, question: q.replace("{DAY}", "Friday") });
      // expand with day + time + modifier combinations (creates LOTS)
      for (const day of days) {
        out.push({ id: `${cat[0].toLowerCase()}${id++}`, category: cat, question: q.replace("{DAY}", day) });
      }
      for (const t of times) {
        out.push({ id: `${cat[0].toLowerCase()}${id++}`, category: cat, question: `${q.replace("{DAY}", "Friday")} ${t}?` });
      }
      for (const mod of modifiers) {
        out.push({ id: `${cat[0].toLowerCase()}${id++}`, category: cat, question: `${q.replace("{DAY}", "Friday")} ${mod}` });
      }
    }
  }

  // Ensure variety + cap (still well above 200)
  // Keep only reasonable length + unique text
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

  // Guaranteed 200+; if somehow less, add some fallback variants.
  if (cleaned.length < 220) {
    let x = 0;
    while (cleaned.length < 220) {
      const cat = categories[x % categories.length];
      cleaned.push({
        id: `x${x++}`,
        category: cat,
        question: `Can you help me with something ${x % 2 ? "today" : "this week"}?`,
      });
    }
  }

  return cleaned;
}

export const QUESTION_LIBRARY: QuestionItem[] = buildQuestionLibrary();
