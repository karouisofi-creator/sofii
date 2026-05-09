import TypingDots from "./TypingDots";

export default function ChatMessages({ messages, loading, messagesEndRef }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px 8px" }}>
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: isUser ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            {!isUser && (
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(5,150,105,0.25)",
                }}
              >
                🤖
              </div>
            )}
            <div
              style={{
                maxWidth: "78%",
                padding: "9px 13px",
                borderRadius: isUser
                  ? "14px 14px 3px 14px"
                  : "3px 14px 14px 14px",
                background: isUser
                  ? "linear-gradient(135deg, #059669, #047857)"
                  : "rgba(255,255,255,0.07)",
                color: "#ecfdf5",
                fontSize: 13,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
          </div>
        );
      })}
      {loading && <TypingDots />}
      <div ref={messagesEndRef} />
    </div>
  );
}
