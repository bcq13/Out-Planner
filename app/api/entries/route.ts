import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function supabaseOrError() {
  try {
    return { supabase: getSupabase() as ReturnType<typeof getSupabase> };
  } catch (e) {
    return { error: "Supabase env vars missing in deployment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel." };
  }
}

export async function GET(req: Request) {
  try {
  const { searchParams } = new URL(req.url);
  const device_id = searchParams.get("device_id");
  const year = searchParams.get("year");

  if (!device_id || !year) {
    return NextResponse.json({ error: "Missing device_id or year" }, { status: 400 });
   } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error", details: String(e) },
      { status: 500 }
    );
  }
}
 }

  const s = supabaseOrError();
  if (error)
  return NextResponse.json(
    { error: error.message, code: (error as any).code, hint: (error as any).hint, details: error },
    { status: 500 }
  );

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data, error } = await s.supabase
    .from("excuse_entries")
    .select("*")
    .eq("device_id", device_id)
    .gte("entry_date", start)
    .lte("entry_date", end);

  if (error)
  return NextResponse.json(
    { error: error.message, code: (error as any).code, hint: (error as any).hint, details: error },
    { status: 500 }
  );
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
  const body = await req.json();

  const s = supabaseOrError();
  if ("error" in s) return NextResponse.json({ error: s.error }, { status: 500 });

  const { data, error } = await s.supabase
    .from("excuse_entries")
    .upsert(body, { onConflict: "device_id,entry_date" })
    .select()
    .single();

  if (error)
  return NextResponse.json(
    { error: error.message, code: (error as any).code, hint: (error as any).hint, details: error },
    { status: 500 }
  );
  return NextResponse.json({ data });  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error", details: String(e) },
      { status: 500 }
    );
  }
}

}
