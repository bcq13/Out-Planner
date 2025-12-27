import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function supabaseOrNull() {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}

const FALLBACK_TIPS = [
  { id: "t1", title: "The “soft no” sandwich", body: "Start warm → say no → offer a next step: “I can’t, but I hope it goes well. Let’s catch up next week.”" },
  { id: "t2", title: "Use time, not emotion", body: "“I’m not available at that time.” is harder to argue with than “I’m tired.”" },
  { id: "t3", title: "One sentence is enough", body: "If they push: repeat the same sentence. Don’t add details — details create debate." },
  { id: "t4", title: "Delay before you decide", body: "Buy space: “Let me check and get back to you.” Then respond later with a clean no." },
  { id: "t5", title: "The broken record", body: "Repeat the boundary calmly: “I can’t.” “I can’t.” “I can’t.” (No new info.)" },
  { id: "t6", title: "Offer alternatives you actually want", body: "Only suggest options you mean: “I can’t do dinner, but I can do a 10-minute call Thursday.”" },
  { id: "t7", title: "Name the pressure", body: "For pushy people: “I’m feeling pressured — I’m still saying no.”" },
  { id: "t8", title: "No apology spirals", body: "A quick thanks beats over-apologizing. Long apologies invite negotiation." },
  { id: "t9", title: "Work-safe deflection", body: "“I have a conflict” is all you owe. If needed: “Please proceed without me.”" },
  { id: "t10", title: "Reschedule with control", body: "Give 2 options max. More options = more back-and-forth." },
  { id: "t11", title: "Exit line", body: "End gracefully: “I’ve answered. I’m going to hop off now.”" },
  { id: "t12", title: "Spicy without being rude", body: "Short + calm: “No.” (Then stop typing.) Silence is a complete sentence." },
  { id: "t13", title: "Don’t negotiate against yourself", body: "Don’t add extras: “Unless… maybe…” If you said no, stop talking." },
  { id: "t14", title: "Text message trick", body: "Send the no, then put your phone down for 10 minutes. Don’t argue in real time." },
  { id: "t15", title: "Boundary escalation ladder", body: "Kind → Firm → No details → Close the conversation. Escalate only if they push." },
];

export async function GET() {
  // Try Supabase first; if empty/unavailable, serve fallback tips.
  const supabase = supabaseOrNull();

  if (supabase) {
    const { data, error } = await supabase.from("tips").select("*").limit(50);
    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({ data });
    }
  }

  return NextResponse.json({ data: FALLBACK_TIPS });
}
