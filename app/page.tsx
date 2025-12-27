"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDeviceId } from "@/lib/deviceId";
import {
  QUESTION_LIBRARY,
  escalateFromRequest,
  generateExcuse,
  generateFromRequest,
  generateUnique,
  rewriteVariant,
} from "@/lib/excuseEngine";
import type { Audience, Mood, QuestionItem } from "@/lib/excuseEngine";

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

function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [breakpoint]);
  return isMobile;
}

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const [deviceId, setDeviceId] = useState("");

  const [audience, setAudience] = useState<Audience>("friends");
  const [mood, setMood] = useState<Mood>("standup");
  const [makeThemThink, setMakeThemThink] = useState<boolean>(true);

  const [request, setRequest] = useState<string>("");
  const [draft, setDraft] = useState<string>("");
  const [toast, setToast] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [escalation, setEscalation] = useState<number>(0);

  const [saved, setSaved] = useState<Saved[]>([]);
  const favorites = useMemo(() => saved.filter((s) => s.favorite), [saved]);

  // Question library filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  // Variation counters: forces new seeds each time
  const generateCountRef = useRef(1);
  const autoCountRef = useRef(1);

  // Prevent auto-typing generation from overwriting user-edited draft
  const draftEditedRef = useRef(false);
  const lastAutoRequestRef = useRef<string>("");

  const filteredQuestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QUESTION_LIBRARY.filter((item) => {
      const okCat = category === "All" ? true : item.category === category;
      const okQ = !q ? true : item.question.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [query, category]);

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);

    try {
      const raw = localStorage.getItem(`outplanner_saved_${id}`);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}

    setDraft(generateExcuse("standup", true, Date.now()));
  }, []);

  useEffect(() => {
    if (!deviceId) return;
    try {
      localStorage.setItem(`outplanner_saved_${deviceId}`, JSON.stringify(saved));
    } catch {}
  }, [saved, deviceId]);

  function haptic() {
    try {
      if ("vibrate" in navigator) (navigator as any).vibrate?.(10);
    } catch {}
  }

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1100);
  }

  function seedBase(extra = 0) {
    // changes every click / auto-gen, and also depends on request text
    const req = normalize(request);
    const base = Date.now() ^ (req.length * 131) ^ (extra * 9973);
    return base;
  }

  function getGenerated(seed: number) {
    const hasRequest = normalize(request).length > 0;
    if (hasRequest) return generateFromRequest({ mood, audience, request, makeThemThink, seed });
    return generateExcuse(mood, makeThemThink, seed);
  }

  function onGenerate() {
    haptic();
    setEscalation(0);
    draftEditedRef.current = false;

    const n = generateCountRef.current++;
    const next = generateUnique((s) => getGenerated(s), draft, seedBase(n));
    setDraft(next);
    setStatus("");
  }

  function onEscalate() {
    haptic();
    const nextLevel = escalation + 1;
    setEscalation(nextLevel);
    draftEditedRef.current = false;

    const seed = seedBase(nextLevel + generateCountRef.current);
    const next = escalateFromRequest({ level: nextLevel, mood, audience, request, makeThemThink, seed });
    setDraft(next);
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

  function onStarDraft() {
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
    draftEditedRef.current = false;

    const seed = seedBase(generateCountRef.current++);
    const next = rewriteVariant(draft, nextMood, audience, request, makeThemThink, seed);
    setDraft(next);
    setStatus("");
  }

  function useQuestion(item: QuestionItem) {
    haptic();
    setRequest(item.question);
    setEscalation(0);
    draftEditedRef.current = false;

    const n = generateCountRef.current++;
    const seed = seedBase(n) ^ item.id.length * 123;
    const next = generateUnique(
      (s) => generateFromRequest({ mood, audience, request: item.question, makeThemThink, seed: s }),
      draft,
      seed
    );
    setDraft(next);
    showToast("Question loaded ✓");
  }

  // ✅ Auto-generate while typing (debounced) — but DO NOT overwrite if user edited draft
  useEffect(() => {
    const req = normalize(request);

    // only auto-gen when request is meaningful
    if (req.length < 8) return;

    // if user is editing the draft manually, don't overwrite
    if (draftEditedRef.current) return;

    // don’t re-auto-generate for identical request repeatedly
    if (req === lastAutoRequestRef.current) return;

    const t = window.setTimeout(() => {
      // still safe checks at fire time
      if (draftEditedRef.current) return;

      const n = autoCountRef.current++;
      const seed = seedBase(100000 + n);

      const next = generateUnique(
        (s) => generateFromRequest({ mood, audience, request: req, makeThemThink, seed: s }),
        draft,
        seed
      );

      setDraft(next);
      lastAutoRequestRef.current = req;
    }, 550); // debounce time

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  // Keep experience consistent when toggling “Make them think”
  useEffect(() => {
    if (!draft.trim()) return;
    draftEditedRef.current = false;
    const n = generateCountRef.current++;
    const next = generateUnique((s) => getGenerated(s), draft, seedBase(n));
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makeThemThink]);

  const gridStyle: React.CSSProperties = isMobile
    ? { display: "grid", gridTemplateColumns: "1fr", gap: 14, marginTop: 14 }
    : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 };

  return (
    <main
      className={isMobile ? "mobile-pad-bottom" : ""}
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: 18,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, Segoe UI, Roboto, Arial',
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 32, margin: 0 }}>OutPlanner</h1>
          <p style={{ marginTop: 8, opacity: 0.72 }}>
            200+ common asks → instant get-out replies. Clean humor, boundaries, and one-tap copy.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle dark mode">
            {theme === "dark" ? "☾ Dark" : "☀︎ Light"}
          </button>
          <div style={{ fontSize: 12, opacity: 0.65 }}>device {deviceId ? "linked" : "…"}</div>
        </div>
      </div>

      <section style={gridStyle}>
        {/* LEFT: Composer */}
        <div className="card">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ display: "grid", gap: 6, flex: "1 1 240px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>Select mood</div>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value as Mood)}
                  style={{ padding: "12px 14px", borderRadius: 12, width: "100%" }}
                >
                  <option value="kind">Kind</option>
                  <option value="professional">Professional</option>
                  <option value="funny">Funny</option>
                  <option value="standup">Standup (observational)</option>
                  <option value="spicy">Spicy</option>
                  <option value="firm">Firm</option>
                  <option value="noDetails">No details</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 6, flex: "1 1 200px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>Audience</div>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                  style={{ padding: "12px 14px", borderRadius: 12, width: "100%" }}
                >
                  <option value="friends">Friends</option>
                  <option value="family">Family</option>
                  <option value="work">Work</option>
                </select>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface2)",
                  cursor: "pointer",
                  userSelect: "none",
                  width: "fit-content",
                }}
                title="Adds a short reflective closer (polite, but makes people think)"
              >
                <input
                  type="checkbox"
                  checked={makeThemThink}
                  onChange={(e) => setMakeThemThink(e.target.checked)}
                />
                <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>Make them think</span>
              </label>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
                Paste what they asked (Enter = generate)
              </div>

              <textarea
                value={request}
                onChange={(e) => {
                  setRequest(e.target.value);
                }}
                onKeyDown={(e) => {
                  // Enter generates, Shift+Enter creates newline
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onGenerate();
                  }
                }}
                rows={isMobile ? 4 : 3}
                placeholder='Example: “Can you cover my shift Friday?” or “Want to come over tonight?”'
                style={{ width: "100%", borderRadius: 14, padding: 12, fontSize: 14 }}
              />

              <div style={{ fontSize: 12, opacity: 0.65 }}>
                Tip: If you start editing the excuse, auto-generate won’t overwrite it.
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>Your excuse</div>
                <button className="btn" onClick={onStarDraft} title="Favorite this draft">★</button>
              </div>

              <textarea
                value={draft}
                onChange={(e) => {
                  draftEditedRef.current = true;
                  setDraft(e.target.value);
                }}
                rows={isMobile ? 7 : 5}
                style={{ width: "100%", borderRadius: 16, padding: 14, fontSize: 16, lineHeight: 1.4 }}
              />

              {/* Desktop action row */}
              {!isMobile && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="btn btnPrimary" onClick={onGenerate}>Generate</button>
                  <button className="btn" onClick={() => onCopy(draft)}>Copy</button>
                  <button className="btn" onClick={onSave}>Save</button>
                  <button className="btn" onClick={onEscalate}>They asked again</button>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{status}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn" onClick={() => onRewrite("noDetails")}>Shorter</button>
                <button className="btn" onClick={() => onRewrite("firm")}>Firmer</button>
                <button className="btn" onClick={() => onRewrite("professional")}>Work-safe</button>
                <button className="btn" onClick={() => onRewrite("kind")}>Kinder</button>
                <button className="btn" onClick={() => onRewrite("funny")}>Funnier</button>
                <button className="btn" onClick={() => onRewrite("standup")}>More standup</button>
                <button className="btn" onClick={() => onRewrite("spicy")}>Spicier</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Library + Saved */}
        <div className="card">
          <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>
            Question Library <span style={{ fontSize: 12, opacity: 0.65 }}>({QUESTION_LIBRARY.length})</span>
          </h2>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              style={{ flex: "1 1 240px", padding: "12px 14px", borderRadius: 12 }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: "12px 14px", borderRadius: 12 }}
            >
              <option value="All">All</option>
              <option value="Work">Work</option>
              <option value="Social">Social</option>
              <option value="Family">Family</option>
              <option value="Money">Money</option>
              <option value="Church/Volunteer">Church/Volunteer</option>
              <option value="Moving/Errands">Moving/Errands</option>
              <option value="Random">Random</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 8, maxHeight: isMobile ? 280 : 360, overflow: "auto", paddingRight: 4 }}>
            {filteredQuestions.slice(0, 60).map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  background: "var(--surface2)",
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{item.category}</div>
                <div style={{ marginBottom: 10 }}>{item.question}</div>
                <button className="btn" onClick={() => useQuestion(item)}>Use this</button>
              </div>
            ))}
            {filteredQuestions.length === 0 && (
              <div style={{ opacity: 0.7 }}>No matches. Try a different search.</div>
            )}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />

          <h2 style={{ margin: 0, marginBottom: 10, fontSize: 18 }}>Saved</h2>

          {favorites.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, marginBottom: 8 }}>Favorites</div>
              <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                {favorites.slice(0, 4).map((s, idx) => (
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
              {saved.slice(0, 10).map((s, i) => (
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

      {/* Mobile sticky bar */}
      {isMobile && (
        <div className="mobile-copybar">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button className="btn btnPrimary" onClick={onGenerate} style={{ width: "100%", padding: "14px 14px" }}>
              Generate
            </button>
            <button className="btn" onClick={() => onCopy(draft)} style={{ width: "100%", padding: "14px 14px" }}>
              Copy
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <button className="btn" onClick={onSave} style={{ width: "100%", padding: "12px 14px" }}>
              Save
            </button>
            <button className="btn" onClick={onEscalate} style={{ width: "100%", padding: "12px 14px" }}>
              They asked again
            </button>
          </div>
          {status ? (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, textAlign: "center" }}>{status}</div>
          ) : null}
        </div>
      )}

      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </main>
  );
}
