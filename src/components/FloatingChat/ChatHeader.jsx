export default function ChatHeader({ setMessages, setOpen }) {
  const SYSTEM_INITIAL =
    "Bienvenue ! Je suis votre assistant DataFlow. Recherchez par spécialité ou posez une question.";

  return (
    <div
      style={{
        padding: "14px 14px",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h7l-1 8L21 10h-7l-1-8z" fill="white" />
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>DataFlow IA</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
              }}
            ></div>
            <span style={{ color: "#cbd5e1" }}>Assistant actif</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen(false)}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.color = "white")}
        onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.7)")}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
