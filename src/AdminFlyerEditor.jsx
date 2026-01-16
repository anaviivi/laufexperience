import { useState } from "react";

export default function AdminFlyerEditor() {
  const [text, setText] = useState("Flyer Inhalt...");

  return (
    <div style={{ padding: 16 }}>
      <h2>Admin Flyer Editor</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        style={{ width: "100%", fontFamily: "inherit", fontSize: 14, padding: 10 }}
      />

      <div style={{ marginTop: 16 }}>
        <h3>Vorschau</h3>
        <div style={{ border: "1px solid #ccc", padding: 12, whiteSpace: "pre-wrap" }}>
          {text}
        </div>
      </div>
    </div>
  );
}
