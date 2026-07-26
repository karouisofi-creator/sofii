import { useEffect, useState } from "react";

// Suggestions will be loaded from the server categories endpoint
// Fallback to a small default list if the API is unavailable
const DEFAULT_SUGGESTIONS = [
  "Cardiologie",
  "Optique",
  "Dentaire",
  "ORL",
  "Imagerie médicale",
];

export default function Suggestions({ setInput, sendMessage }) {
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/chat/knowledge-base/categories");
        if (!res.ok) throw new Error("no categories");
        const data = await res.json();
        if (
          mounted &&
          data &&
          Array.isArray(data.categories) &&
          data.categories.length
        ) {
          setSuggestions(data.categories.slice(0, 24));
        }
      } catch (e) {
        // keep defaults
      }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <div
      style={{
        padding: "10px 12px",
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        borderTop: "1px solid rgba(2,6,23,0.06)",
        background: "transparent",
      }}
    >
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => {
            setInput(s);
            if (typeof sendMessage === "function") sendMessage(s);
          }}
          style={{
            background: "#eef2ff",
            border: "1px solid rgba(99,102,241,0.12)",
            borderRadius: 20,
            color: "#3730a3",
            padding: "6px 12px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
