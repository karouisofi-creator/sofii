export default function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "10px 14px",
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#06b6a4,#047857)",
            animation: `df-bounce 1.2s infinite ${i * 0.18}s`,
            boxShadow: "0 6px 14px rgba(4,120,87,0.12)",
          }}
        />
      ))}
    </div>
  );
}
