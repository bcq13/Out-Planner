"use client";

import { useEffect, useMemo, useState } from "react";
import { getDeviceId } from "@/lib/deviceId";
import { escalate, generateExcuse, generateFromRequest, rewriteVariant } from "@/lib/excuseEngine";
import type { Audience, Mood } from "@/lib/excuseEngine";

type Saved = { text: string; favorite?: boolean; createdAt: number };

function normalize(s: string) {
  return (s || "").trim().replace(/\s+/g, " ");
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("outplanner_theme") as "light" | "dark" | null;
    const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    const initial = stored ?? (systemDark ? "dark" : "light");
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("outplanner_theme", theme);
  }, [theme]);

  return { theme, setTheme };
}

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  const [deviceId, setDeviceId] = useState("");

  const [audience, setAudience] = useState<Audience>("friends");
  const [mood, setMood] = useState<Mood>("kind");
  const [request, setRequest] = useState<string>("");

  const [draft, setDraft] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const [escalation, setEscalation] = useState<number>(0);

  const [saved, setSaved] = useState<Saved[]>([]);

  // Load device + saved
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);

    try {
      const raw = localStorage.getItem(`outplanner_saved_${id}`);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}

    setDraft(generateExcuse("kind"));
  }, []);

  // Persist saved
  useEffect(() => {
    if (!deviceId) return;
    try {
      localStorage.setItem(`outplanner_saved_${deviceId}`, JSON.stringify(saved));
    } catch {}
  }, [saved, deviceId]);

  const favorites = useMemo(() => saved.filter((s) => s.favorite), [saved]);

  function haptic() {
    // Optional tiny vibration on supported devices (won’t do anything on most desktops)
    try {
      if ("vibrate" in navigator) (navigator as any).vibrate?.(10);
    } catch {}
  }

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1100);
  }

  function makeDraft() {
    const hasRequest = normalize(request).length > 0;
    if (hasRequest) return generateFromRequest({ mood, audience, request });
    return generateExcuse(mood);
  }

  function onGenerate() {
    haptic();
    setEscalation(0);
    setDraft(makeDraft());
    setStatus("");
  }

  function onEscalate() {
    haptic();
    const next = escalation + 1;
    setEscalation(next);
    setDraft(escalate(next));
    setStatus("");
  }

  async function onCopy(text: string) {
    haptic();
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied ✓");
    } catch {
      setStatus("Copy failed (clipboard blocked)");
    }
  }

  function saveText(text: string, favorite = false) {
    const t = normalize(text);
    if (!t) return;

    setSaved((prev) => [{ text: t, favorite, createdAt: Date.now() }, ...prev]);
    setStatus(favorite ? "Saved to Favorites ✓" : "Saved ✓");
    window.setTimeout(() => setStatus(""), 1200);
  }

  function onSave() {
    haptic();
    saveText(draft, false);
  }

  function onSaveFavorite() {
    haptic();
    saveText(draft, true);
  }

  function toggleFav(index: number) {
    haptic();
    setSaved((prev) => prev.map((s, i) => (i === index ? { ...s, favorite: !s.favorite } : s)));
  }

  function onRewrite(nextMood: Mood) {
    haptic();
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
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 34, margin: 0 }}>OutPlanner</h1>
          <p style={{ marginTop: 8, opacity: 0.72 }}>
            Say no without guilt. Copy. Save. Escalate when they won’t stop.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle dark mode"
          >
            {theme === "dark" ? "☾ Dark" : "☀︎ Light"}
          </button>
          <div style={{ fontSize: 12, opacity: 0.65 }}>device {deviceId ? "linked" : "…"}</div>
        </div>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {/* LEFT */}
        <div className="card">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>Select mood</div>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value as Mood)}
                  style={{ padding: "10px 14px", borderRadius: 12, minWidth: 220 }}
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
                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>Audience</div>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                  style={{ padding: "10px 14px", borderRadius: 12, minWidth: 220 }}
                >
                  <option value="friends">Friends</option>
                  <option value="family">Family</option>
                  <option value="work">Work</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>Paste what they asked (optional)</div>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                rows={3}
                placeholder='Example: “Can you cover my shift Friday?” or “Want to come over tonight?”'
                style={{ width: "100%", borderRadius: 14, padding: 12, fontSize: 14 }}
              />
              <div style={{ fontSize: 12, opacity: 0.65 }}>
                More specific request → more believable excuse.
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>Your excuse</div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                style={{ width: "100%", borderRadius: 16, padding: 14, fontSize: 16, lineHeight: 1.4 }}
              />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button className="btn" onClick={onGenerate}>Generate</button>
                <button className="btn" onClick={() => onCopy(draft)}>Copy</button>

                {/* Draft star */}
                <button className="btn" onClick={onSaveFavorite} title="Save draft to Favorites">
                  ★ Save to Favorites
                </button>

                <button className="btn" onClick={onSave}>Save</button>
                <button className="btn" onClick={onEscalate}>They asked again</button>

                <div style={{ fontSize: 12, opacity: 0.7 }}>{status}</div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn" onClick={() => onRewrite("noDetails")}>Shorter</button>
                <button className="btn" onClick={() => onRewrite("firm")}>Firmer</button>
                <button className="btn" onClick={() => onRewrite("professional")}>Work-safe</button>
                <button className="btn" onClick={() => onRewrite("kind")}>Kinder</button>
                <button className="btn" onClick={() => onRewrite("funny")}>Funnier</button>
                <button className="btn" onClick={() => onRewrite("spicy")}>Spicier</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="card">
          <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>Saved</h2>

          {favorites.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, marginBottom: 8 }}>Favorites</div>
              <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                {favorites.slice(0, 6).map((s, idx) => (
                  <div
                    key={`fav-${idx}`}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      background: "var(--surface2)",
                    }}
                  >
                    <div style={{ marginBottom: 10 }}>{s.text}</div>
                    <button className="btn" onClick={() => onCopy(s.text)}>Copy</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {saved.length === 0 ? (
            <p style={{ opacity: 0.65 }}>No saved excuses yet. Generate one, copy it, then Save.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {saved.slice(0, 20).map((s, i) => (
                <div
                  key={s.createdAt}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    background: "var(--surface2)",
                  }}
                >
                  <div style={{ marginBottom: 10 }}>{s.text}</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn" onClick={() => onCopy(s.text)}>Copy</button>
                    <button className="btn" onClick={() => toggleFav(i)}>
                      {s.favorite ? "★ Favorited" : "☆ Favorite"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Toast */}
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </main>
  );
}
