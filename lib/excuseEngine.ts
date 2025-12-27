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

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 100+ total across tones (you can keep adding lines forever)
const excuseBank: Record<Tone, string[]> = {
  kind: [
    "I can’t make it, but thank you for thinking of me.",
    "I’m going to pass today — I really appreciate the invite.",
    "I’m not able to, but I hope it goes great.",
    "I need to sit this one out — thanks for understanding.",
    "I’m going to take a quiet day. Thank you for the grace.",
    "I can’t tonight, but I’d love to catch up soon.",
    "I’m not available, but I’m cheering you on.",
    "I need to protect my bandwidth today — thank you for understanding.",
    "I can’t make it work, but I’m grateful you asked.",
    "Not this time, but I hope you have a great time.",
    "I’m going to say no today — thanks for being cool about it.",
    "I can’t commit to that right now, but I appreciate you.",
  ],

  professional: [
    "I’m unavailable due to a scheduling conflict.",
    "I won’t be able to attend as planned.",
    "I need to decline due to prior commitments.",
    "I’m unable to participate at this time.",
    "I’m not available for that time slot.",
    "I won’t be able to take this on right now.",
    "I have a conflict and will need to step back.",
    "I’m not able to meet today — let’s find another time.",
    "I won’t be able to join, but thank you for the invitation.",
    "I’m unavailable; please proceed without me.",
    "I can’t make it work this week.",
    "I’ll need to pass for now.",
  ],

  funny: [
    "I have an unexpected appointment with my couch.",
    "My calendar said “absolutely not.”",
    "I’m at capacity for human interaction today.",
    "I have a prior commitment to doing nothing.",
    "I’m currently booked for a long meeting with myself.",
    "Today is not a “people day.”",
    "I can’t — my social battery is on 1%.",
    "I’m out of office… emotionally.",
    "I’d love to, but my adulting quota is full.",
    "I’m practicing saying no for my personal growth.",
    "I can’t make it — I’m in my villain era (resting).",
    "I’m unavailable due to a serious case of ‘not today.’",
  ],

  spicy: [
    "No thanks.",
    "I’m not doing that.",
    "That’s a no for me.",
    "Not happening.",
    "I’m opting out.",
    "I’m not available — period.",
    "No. ❤️",
    "Hard pass.",
    "I’m good.",
    "I said no.",
    "I’m choosing rest instead.",
    "That doesn’t work for me.",
  ],

  firm: [
    "I’m not available.",
    "I won’t be attending.",
    "That doesn’t work for me.",
    "I need to decline.",
    "I’m saying no.",
    "I can’t commit to that.",
    "I’m not able to help with this.",
    "I’m not taking on anything else.",
    "I’m unavailable — please plan without me.",
    "I’m not changing my answer.",
    "I’m not open to that.",
    "I can’t do that.",
  ],

  workSafe: [
    "I have a conflict and won’t be able to attend.",
    "I’m unavailable during that window.",
    "I’ll need to step out of this.",
    "I’m not able to join today.",
    "I can’t make that time.",
    "I’m at capacity and can’t take this on.",
    "I won’t be able to support this request right now.",
    "I’ll need to decline, thanks.",
    "I’m not able to meet; please send notes.",
    "I’m unavailable — can we move it?",
    "I can’t attend, but I hope it goes well.",
    "I’ll pass this time.",
  ],

  noDetails: [
    "I can’t make it.",
    "I’m unavailable.",
    "Not today.",
    "I’ll need to pass.",
    "I can’t.",
    "No.",
    "I’m not able to.",
    "Not this time.",
    "Can’t do it.",
    "I’m out.",
    "I’m not available.",
    "I can’t commit.",
  ],

  reschedule: [
    "I can’t make it today — can we reschedule?",
    "Today doesn’t work, but another time might.",
    "I’ll need to pass today; happy to reconnect later.",
    "Can we find another day that works?",
    "Let’s move this to another time.",
    "I can’t today — how about later this week?",
    "I’m booked today. What about tomorrow?",
    "Can we push this to next week?",
    "I’m unavailable — can we pick a new time?",
    "I can’t make that slot; I’m open another time.",
    "Not today, but I can do another day.",
    "Let’s reschedule — send a couple options.",
  ],
};

// Pushy-people scripts: lots of variety, escalating firmness
const boundaryScripts = [
  // gentle
  "I hear you. My answer is still no.",
  "I’m not able to, and that’s final.",
  "I’m going to stick with my no.",
  "I appreciate the ask, but I’m not available.",
  "I understand. I still can’t.",
  // firm
  "I’ve already answered.",
  "I’m not changing my mind.",
  "Please respect my decision.",
  "No means no.",
  "I’m not available to discuss this further.",
  // harder
  "I’m not going to explain myself.",
  "I don’t owe details.",
  "This conversation is closed.",
  "Stop pushing.",
  "If you keep pushing, I’m ending the conversation.",
  // nuclear (still non-abusive)
  "I’m done talking about this.",
  "I’ve said no. Do not ask again.",
  "This isn’t up for negotiation.",
  "I’m not engaging with repeated requests.",
  "We’re not doing this.",
];

export function generateExcuse(tone: Tone) {
  return pick(excuseBank[tone]);
}

export function rewriteVariant(_text: string, mode: Tone) {
  // Regenerate in the chosen mode (simple + reliable)
  return generateExcuse(mode);
}

export function generateBoundaryScript() {
  return pick(boundaryScripts);
}
