import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const device_id = searchParams.get("device_id");
  const year = Number(searchParams.get("year"));

  if (!device_id || !year) {
    return NextResponse.json({ error: "Missing device_id or year" }, { status: 400 });
  }

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data, error } = await supabase
    .from("excuse_entries")
    .select("*")
    .eq("device_id", device_id)
    .gte("entry_date", start)
    .lte("entry_date", end)
    .order("entry_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { device_id, entry_date, audience, fun_level, excuse_text, entry_type } = body ?? {};

  if (!device_id || !entry_date || !audience || fun_level === undefined || !excuse_text) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // One entry per date per device (upsert behavior)
  const { data: existing, error: existingError } = await supabase
    .from("excuse_entries")
    .select("id")
    .eq("device_id", device_id)
    .eq("entry_date", entry_date)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("excuse_entries")
      .update({ audience, fun_level, excuse_text, entry_type: entry_type ?? "excuse" })
      .eq("id", existing.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.from("excuse_entries").insert([
    { device_id, entry_date, audience, fun_level, excuse_text, entry_type: entry_type ?? "excuse" },
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, created: true });
}

