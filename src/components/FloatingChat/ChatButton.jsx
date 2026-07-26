export default function ChatButton({ open, setOpen, unread }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        aria-label="Assistant DataFlow"
        onClick={() => setOpen(!open)}
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
            : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          transform: open ? "scale(0.96)" : "scale(1)",
          boxShadow: open
            ? "0 10px 30px rgba(2, 6, 23, 0.25)"
            : "0 12px 40px rgba(37, 99, 235, 0.25)",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.target.style.transform = "scale(1.08)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.target.style.transform = "scale(1)";
          }
        }}
        title="Assistant DataFlow"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M13 2L3 14h7l-1 8L21 10h-7l-1-8z" />
        </svg>
      </button>

      {unread > 0 && !open && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            minWidth: 24,
            height: 24,
            padding: "0 6px",
            borderRadius: "50%",
            background: "#ef4444",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid white",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
          }}
        >
          {unread > 9 ? "9+" : unread}
        </div>
      )}
    </div>
  );
}
