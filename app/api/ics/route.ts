import { NextResponse } from "next/server";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function yyyymmdd(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

// Simple all-day event export for MVP
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const title = searchParams.get("title") ?? "OutPlanner: Busy";
  const note = searchParams.get("note") ?? "";

  if (!dateStr) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  const date = new Date(`${dateStr}T00:00:00`);
  const dt = yyyymmdd(date);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OutPlanner//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${dt}`,
    `DTEND;VALUE=DATE:${dt}`,
    `SUMMARY:${title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${note.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="outplanner-${dt}.ics"`,
    },
  });
}

