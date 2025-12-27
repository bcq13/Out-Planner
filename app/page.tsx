"use client";

import { useEffect, useMemo, useState } from "react";
import { getDeviceId } from "@/lib/deviceId";
import { escalate, generateExcuse, generateFromRequest, rewriteVariant } from "@/lib/excuseEngine";
import type { Audience, Mood } from "@/lib/excuseEngine";

type Saved = { text: string; favorite?: boolean; createdAt: number };

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.85)",
  cursor: "pointer",
  color: "#111",
};

const card: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.70)",
  backdropFilter: "blur(10px)",
  padding: 16,
};

function nowYear() {
  return new Date().getFullYear();
}

export default function HomePage() {
  const [deviceId, setDeviceId] = useState("");

  const [audience, setAudience] = useState<Audience>("friends");
  const [mood, setMood] = useState<Mood>("kind");
  const [request, setRequest] = useState<string>("");

  const [draft, setDraft] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  const [escalation, setEscalation] = useState<number>(0);

  const [saved, setSaved] = useState<Saved[]>([]);

  // Load device id + saved (local)
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);

    try {
      const raw = localStorage.getItem(`outplanner_saved_${id}`);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}

    setDraft(generateExcuse("kind"));
  }, []);

  // Persist saved list
  useEffect(() => {
    if (!deviceId) return;
    try {
      localStorage.setItem(`outplanner_saved_${deviceId}`, JSON.stringify(saved));
    } catch {}
  }, [saved, deviceId]);

  const favorites = useMemo(() => saved.filter((s) => s.favorite), [saved]);

  function makeDraft() {
    const hasRequest = request.trim().length > 0;
    if (hasRequest) return generateFromRequest({ mood, audience, request });
    return generateExcuse(mood === "noDetails" ? "noDetails" : mood);
  }

  function onGenerate() {
    setEscalation(0);
    setDraft(makeDraft());
    setStatus("");
  }

  function onEscalate() {
    const next = escalation + 1;
    setEscalation(next);
    setDraft(escalate(next));
    setStatus("");
  }

  async function onCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {
      setStatus("Copy failed (browser blocked clipboard)");
    }
  }

  function onSave() {
    if (!draft.trim()) return;
    setSaved((prev) => [{ text: draft.trim(), createdAt: Date.now() }, ...prev]);
    setStatus("Saved ✓");
    setTimeout(() => setStatus(""), 1200);
  }

  function toggleFav(index: number) {
    setSaved((prev) => prev.map((s, i) => (i === index ? { ...s, favorite: !s.favorite } : s)));
  }

  function onRewrite(nextMood: Mood) {
    setMood(nextMood);
    setDraft((prev) => rewriteVariant(prev, nextMood, audience, request));
    setStatus("");
  }

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: 22,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, Segoe UI, Roboto, Arial',
        color: "#111",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 34, margin: 0 }}>OutPlanner</h1>
          <p style={{ opacity: 0.72, marginTop: 8 }}>
            Say no without guilt. Copy. Save. Escalate when they won’t stop.
          </p>
        </div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>v {nowYear()} • device {deviceId ? "linked" : "…"}</div>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {/* LEFT: Inputs + Draft */}
        <div style={card}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Select mood</div>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value as Mood)}
                  style={{ ...btn, minWidth: 200 }}
                >
                  <option value="kind">Kind</option>
                  <option value="professional">Professional</option>
                  <option value="funny">Funny</option>
                  <option value="spicy">Spicy</option>
                  <option value="firm">Firm</option>
                  <option value="noDetails">No details</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Audience</div>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                  style={{ ...btn, minWidth: 200 }}
                >
                  <option value="friends">Friends</option>
                  <option value="family">Family</option>
                  <option value="work">Work</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Paste what they asked (optional)</div>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                rows={3}
                placeholder='Example: “Can you cover my shift on Friday?” or “Want to come over tonight?”'
                style={{
                  width: "100%",
                  borderRadius: 14,
                  padding: 12,
                  fontSize: 14,
                  border: "1px solid rgba(0,0,0,0.14)",
                  outline: "none",
                }}
              />
              <div style={{ fontSize: 12, opacity: 0.65 }}>
                Tip: the more specific the request, the more believable the excuse.
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Your excuse</div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                style={{
                  width: "100%",
                  borderRadius: 16,
                  padding: 14,
                  fontSize: 16,
                  lineHeight: 1.4,
                  border: "1px solid rgba(0,0,0,0.14)",
                  outline: "none",
                }}
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button style={btn} onClick={onGenerate}>Generate</button>
                <button style={btn} onClick={() => onCopy(draft)}>{copied ? "Copied ✓" : "Copy"}</button>
                <button style={btn} onClick={onSave}>Save</button>
                <button style={btn} onClick={onEscalate}>They asked again</button>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{status}</div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={btn} onClick={() => onRewrite("noDetails")}>Shorter</button>
                <button style={btn} onClick={() => onRewrite("firm")}>Firmer</button>
                <button style={btn} onClick={() => onRewrite("professional")}>Work-safe</button>
                <button style={btn} onClick={() => onRewrite("kind")}>Kinder</button>
                <button style={btn} onClick={() => onRewrite("funny")}>Funnier</button>
                <button style={btn} onClick={() => onRewrite("spicy")}>Spicier</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Favorites + Saved */}
        <div style={card}>
          <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>Saved</h2>

          {favorites.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, marginBottom: 8 }}>Favorites</div>
              <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                {favorites.slice(0, 6).map((s, idx) => (
                  <div key={`fav-${idx}`} style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.8)" }}>
                    <div style={{ marginBottom: 10 }}>{s.text}</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button style={btn} onClick={() => onCopy(s.text)}>Copy</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {saved.length === 0 ? (
            <p style={{ opacity: 0.65 }}>No saved excuses yet. Generate one, copy it, then hit Save.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {saved.slice(0, 20).map((s, i) => (
                <div
                  key={s.createdAt}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "rgba(255,255,255,0.8)",
                  }}
                >
                  <div style={{ marginBottom: 10 }}>{s.text}</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button style={btn} onClick={() => onCopy(s.text)}>Copy</button>
                    <button style={btn} onClick={() => toggleFav(i)}>{s.favorite ? "★ Favorited" : "☆ Favorite"}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
