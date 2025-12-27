"use client";

import { useEffect, useState } from "react";
import { getDeviceId } from "@/lib/deviceId";
import { generateExcuse, escalate, Tone } from "@/lib/excuseEngine";

type Saved = {
  text: string;
  favorite?: boolean;
};

const btn = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};

export default function HomePage() {
  const [deviceId, setDeviceId] = useState("");
  const [tone, setTone] = useState<Tone>("kind");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [escalation, setEscalation] = useState(0);
  const [saved, setSaved] = useState<Saved[]>([]);

  useEffect(() => {
    setDeviceId(getDeviceId());
    setDraft(generateExcuse("kind"));
  }, []);

  function onGenerate() {
    setEscalation(0);
    setDraft(generateExcuse(tone));
  }

  function onEscalate() {
    const next = escalation + 1;
    setEscalation(next);
    setDraft(escalate(next));
  }

  function onCopy() {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function onSave() {
    setSaved((s) => [{ text: draft }, ...s]);
  }

  function toggleFav(i: number) {
    setSaved((s) =>
      s.map((e, idx) =>
        idx === i ? { ...e, favorite: !e.favorite } : e
      )
    );
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 34 }}>OutPlanner</h1>
      <p style={{ opacity: 0.7 }}>
        Calm, confident ways to say no — without guilt.
      </p>

      {/* Controls */}
      <section style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as Tone)}
          style={{ ...btn, minWidth: 180 }}
        >
          <option value="kind">Kind</option>
          <option value="professional">Professional</option>
          <option value="funny">Funny</option>
          <option value="spicy">Spicy</option>
        </select>

        <button style={btn} onClick={onGenerate}>Generate</button>
        <button style={btn} onClick={onEscalate}>They asked again</button>
      </section>

      {/* Draft */}
      <section style={{ marginTop: 16 }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            borderRadius: 16,
            padding: 16,
            fontSize: 16,
            border: "1px solid #ccc",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button style={btn} onClick={onCopy}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
          <button style={btn} onClick={onSave}>Save</button>
        </div>
      </section>

      {/* Saved */}
      <section style={{ marginTop: 28 }}>
        <h3>Saved</h3>
        {saved.length === 0 && (
          <p style={{ opacity: 0.6 }}>No saved excuses yet.</p>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {saved.map((s, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid #eee",
                background: "#fafafa",
              }}
            >
              <div style={{ marginBottom: 8 }}>{s.text}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={btn} onClick={() => navigator.clipboard.writeText(s.text)}>Copy</button>
                <button style={btn} onClick={() => toggleFav(i)}>
                  {s.favorite ? "★ Favorited" : "☆ Favorite"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
