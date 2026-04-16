const SUGGESTIONS = [
  "💊 Doliprane remboursé ?",
  "📊 Batch pour CFE ?",
  "📋 Créer un reporting",
  "📤 Exporter en Excel",
];

export default function Suggestions({ setInput }) {
  return (
    <div
      style={{
        padding: "6px 12px 8px",
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        borderTop: "1px solid rgba(110,231,183,0.08)",
      }}
    >
      {SUGGESTIONS.map((s, i) => (
        <button
          key={i}
          onClick={() => setInput(s)}
          style={{
            background: "rgba(5,150,105,0.1)",
            border: "1px solid rgba(110,231,183,0.2)",
            borderRadius: 20,
            color: "#a7f3d0",
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
