"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [text, setText] = useState("OutPlanner is starting…");

  useEffect(() => {
    setText("OutPlanner is live and ready.");
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>OutPlanner</h1>
      <p>{text}</p>
    </main>
  );
}
