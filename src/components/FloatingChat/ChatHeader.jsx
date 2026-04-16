export default function ChatHeader({ setMessages }) {
  const SYSTEM_INITIAL =
    "Bonjour ! 👋 Comment puis-je vous aider avec DataFlow Assurance ?";

  return (
    <div
      style={{
        padding: "14px 16px",
        background: "linear-gradient(135deg, #052e16, #0a3a22)",
        borderBottom: "1px solid rgba(110,231,183,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div style={{ color: "#6ee7b7", fontWeight: 600, fontSize: 13 }}>
        DataFlow Assistant
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() =>
            setMessages([{ role: "assistant", content: SYSTEM_INITIAL }])
          }
        >
          Clear
        </button>
      </div>
    </div>
  );
}
