import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function supabaseOrError() {
  try {
    return { supabase: getSupabase() };
  } catch {
    return {
      error:
        "Supabase env vars missing in deployment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel (Production).",
    };
  }
}

function getYearRange(year: number) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return { start, end };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const device_id = url.searchParams.get("device_id");
    const yearParam = url.searchParams.get("year");

    if (!device_id) {
      return NextResponse.json({ error: "device_id is required" }, { status: 400 });
    }

    const year = yearParam ? Number(yearParam) : new Date().getFullYear();
    if (!Number.isFinite(year)) {
      return NextResponse.json({ error: "year must be a number" }, { status: 400 });
    }

    const { start, end } = getYearRange(year);

    const s = supabaseOrError();
    if ("error" in s) return NextResponse.json({ error: s.error }, { status: 500 });

    const { data, error } = await s.supabase
      .from("excuse_entries")
      .select("*")
      .eq("device_id", device_id)
      .gte("entry_date", start)
      .lte("entry_date", end);

    if (error) {
      return NextResponse.json(
        { error: error.message, code: (error as any).code, hint: (error as any).hint, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error", details: String(e) },
      { status: 500 }
    );
  }
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

    if (error) {
      return NextResponse.json(
        { error: error.message, code: (error as any).code, hint: (error as any).hint, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown server error", details: String(e) },
      { status: 500 }
    );
  }
}
