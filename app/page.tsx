"use client";

import { useEffect, useMemo, useState } from "react";
import { getDeviceId } from "@/lib/deviceId";
import { generateBoundaryScript, generateExcuse, rewriteVariant } from "@/lib/excuseEngine";
import type { Audience, Tone } from "@/lib/excuseEngine";

type EntryType = "excuse" | "boundary";

type Entry = {
  id?: string;
  device_id: string;
  entry_date: string; // YYYY-MM-DD
  audience: Audience;
  fun_level: number;
  excuse_text: string;
  entry_type: EntryType;
};

type ProTip = {
  id: string;
  title: string;
  body: string;
};

function yyyy_mm_dd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthName(year: number, i: number) {
  return new Date(year, i, 1).toLocaleDateString(undefined, { month: "long" });
}

const btnStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #111",
  cursor: "pointer",
  background: "white",
  color: "#000",
};

export default function HomePage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [deviceId, setDeviceId] = useState<string>("");

  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [tips, setTips] = useState<ProTip[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(`${new Date().getFullYear()}-01-01`);
  const [audience, setAudience] = useState<Audience>("friends");
  const [funLevel, setFunLevel] = useState<number>(2);

  const [tone, setTone] = useState<Tone>("professional");
  const [pushyMode, setPushyMode] = useState<boolean>(false);

  const [draft, setDraft] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // Keep selectedDate in the chosen year
  useEffect(() => {
    setSelectedDate(`${year}-01-01`);
  }, [year]);

  // Build months/days
  const months = useMemo(() => {
    const arr: { month: number; days: Date[] }[] = [];
    for (let m = 0; m < 12; m++) {
      const days: Date[] = [];
      const d = new Date(year, m, 1);
      while (d.getMonth() === m) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      arr.push({ month: m, days });
    }
    return arr;
  }, [year]);

  // Get device id once
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
  }, []);

  // Load tips once (works even if entries fail)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/tips");
        const j = await r.json();
        setTips(Array.isArray(j?.data) ? j.data : []);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Load entries whenever deviceId/year changes
  useEffect(() => {
    if (!deviceId) return;

    (async () => {
      try {
        const r = await fetch(`/api/entries?device_id=${encodeURIComponent(deviceId)}&year=${year}`);
        const j = await r.json();
        const rows: Entry[] = Array.isArray(j?.data) ? j.data : [];
        const map: Record<string, Entry> = {};
        for (const row of rows) {
          map[row.entry_date] = row;
        }
        setEntries(map);
      } catch {
        // ignore
      }
    })();
  }, [deviceId, year]);

  function makeDraftText() {
    return pushyMode ? generateBoundaryScript() : generateExcuse(tone);
  }

  // When selectedDate changes: load existing OR generate new
  useEffect(() => {
    const existing = entries[selectedDate];

    if (existing) {
      setAudience(existing.audience);
      setFunLevel(existing.fun_level);
      setPushyMode(existing.entry_type === "boundary");
      setDraft(existing.excuse_text);
      return;
    }

    setDraft(makeDraftText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, entries]);

  function onGenerate() {
    setDraft(makeDraftText());
    setStatus("");
  }

  function onRewrite(kind: Tone) {
    setDraft((prev) => rewriteVariant(prev, kind));
    setStatus("");
  }

  async function onSave() {
    if (!deviceId) return;
    if (!draft.trim()) return;

    setStatus("Saving...");

    const entry: Entry = {
      device_id: deviceId,
      entry_date: selectedDate,
      audience,
      fun_level: funLevel,
      excuse_text: draft.trim(),
      entry_type: pushyMode ? "boundary" : "excuse",
    };

    try {
      const r = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      const j = await r.json();
      if (!r.ok) {
        setStatus(j?.error ? `Save failed: ${j.error}` : "Save failed");
        return;
      }

      const saved: Entry = j?.data ?? entry;
      setEntries((prev) => ({ ...prev, [selectedDate]: saved }));
      setStatus("Saved ✅");
    } catch {
      setStatus("Save failed");
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 6 }}>OutPlanner</h1>
      <p style={{ marginTop: 0, opacity: 0.75 }}>
        Daily excuses + pushy-people scripts. Funny, believable, and boundary-friendly.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: 16 }}>
        {/* Calendar */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>{year} Daily Calendar</h2>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={btnStyle} onClick={() => setYear((y) => y - 1)}>
                ◀︎
              </button>
              <button style={btnStyle} onClick={() => setYear(new Date().getFullYear())}>
                Today
              </button>
              <button style={btnStyle} onClick={() => setYear((y) => y + 1)}>
                ▶︎
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 12 }}>
            {months.map(({ month, days }) => (
              <div key={month} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{monthName(year, month)}</div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {days.map((d) => {
                    const key = yyyy_mm_dd(d);
                    const has = !!entries[key];
                    const isSel = key === selectedDate;

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(key)}
                        title={has ? entries[key].excuse_text : "Auto-generated draft"}
                        style={{
                          padding: "6px 0",
                          borderRadius: 8,
                          border: isSel ? "2px solid #111" : "1px solid #ddd",
                          background: has ? "#f3f3f3" : "white",
                          cursor: "pointer",
                          fontSize: 12,
                          color: "#000",
                        }}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor / Controls */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>Draft</h2>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 700 }}>Tone</div>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc", minWidth: 180 }}
                >
                  <option value="professional">Professional</option>
                  <option value="kind">Kind</option>
                  <option value="funny">Funny</option>
                  <option value="spicy">Spicy</option>
                </select>
              </div>

              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 700 }}>Audience</div>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc", minWidth: 180 }}
                >
                  <option value="friends">Friends</option>
                  <option value="family">Family</option>
                  <option value="work">Work</option>
                </select>
              </div>

              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 700 }}>Fun level</div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  value={funLevel}
                  onChange={(e) => setFunLevel(Number(e.target.value))}
                  style={{ width: 180 }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={pushyMode}
                  onChange={(e) => setPushyMode(e.target.checked)}
                />
                Pushy People Mode
              </label>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #ccc",
                fontSize: 14,
                lineHeight: 1.4,
              }}
            />

            {/* Generate / Save */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={btnStyle} onClick={onGenerate}>Generate</button>
              <button style={btnStyle} onClick={onGenerate}>Regenerate</button>
              <button style={btnStyle} onClick={onSave}>Save</button>
              <div style={{ alignSelf: "center", fontSize: 12, opacity: 0.8 }}>{status}</div>
            </div>

            {/* Rewrite buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={btnStyle} onClick={() => onRewrite("noDetails")}>Shorter</button>
              <button style={btnStyle} onClick={() => onRewrite("firm")}>Firmer</button>
              <button style={btnStyle} onClick={() => onRewrite("workSafe")}>Work-safe</button>
              <button style={btnStyle} onClick={() => onRewrite("noDetails")}>No-details</button>
              <button style={btnStyle} onClick={() => onRewrite("reschedule")}>Reschedule</button>
            </div>

            {/* Tone rewrite buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={btnStyle} onClick={() => onRewrite("professional")}>Professional</button>
              <button style={btnStyle} onClick={() => onRewrite("kind")}>Kind</button>
              <button style={btnStyle} onClick={() => onRewrite("funny")}>Funny</button>
              <button style={btnStyle} onClick={() => onRewrite("spicy")}>Spicy</button>
            </div>

            {/* Tips */}
            <div style={{ marginTop: 8 }}>
              <h3 style={{ margin: "8px 0" }}>Pro Tips</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {tips.slice(0, 6).map((t) => (
                  <div key={t.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                    <div style={{ fontWeight: 700 }}>{t.title}</div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>{t.body}</div>
                  </div>
                ))}
                {tips.length === 0 && (
                  <div style={{ fontSize: 13, opacity: 0.7 }}>No tips loaded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
