export default function ChatButton({ open, setOpen, unread }) {
  return (
    <>
      <button
        className="df-fab"
        onClick={() => setOpen(!open)}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #059669 0%, #065f46 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s",
          animation: !open ? "df-pulse 2.5s infinite" : "none",
          boxShadow: "0 4px 20px rgba(5,150,105,0.45)",
        }}
        title="Assistant DataFlow"
      >
        {open ? (
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
      {unread > 0 && !open && (
        <div
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#ef4444",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid white",
          }}
        >
          {unread}
        </div>
      )}
    </>
  );
}
