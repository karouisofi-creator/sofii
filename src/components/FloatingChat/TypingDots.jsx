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
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#059669",
            animation: `df-bounce 1.2s infinite ${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}
