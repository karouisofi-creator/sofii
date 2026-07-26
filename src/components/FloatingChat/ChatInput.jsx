export default function ChatInput({
  input,
  setInput,
  loading,
  inputRef,
  sendMessage,
}) {
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        padding: "14px",
        display: "flex",
        gap: 12,
        alignItems: "flex-end",
        background: "white",
        borderTop: "1px solid rgba(2,6,23,0.08)",
      }}
    >
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Tapez votre question..."
        rows={1}
        style={{
          flex: 1,
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          color: "#0f172a",
          padding: "10px 12px",
          minHeight: 40,
          maxHeight: 140,
          resize: "vertical",
          outline: "none",
          fontSize: 13,
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.background = "#ffffff";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#cbd5e1";
          e.target.style.background = "#f8fafc";
          e.target.style.boxShadow = "none";
        }}
      />
      <button
        onClick={() => sendMessage()}
        disabled={loading || !input.trim()}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
          border: "none",
          cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          opacity: loading || !input.trim() ? 0.6 : 1,
          transition: "all 0.2s",
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (!loading && input.trim()) {
            e.target.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.4)";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && input.trim()) {
            e.target.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,2.0851346 0.837654326,3.0274189 1.15159189,3.97788971 L3.03521743,10.4188827 C3.03521743,10.5759801 3.03521743,10.7330775 3.50612381,10.7330775 L16.6915026,11.5185644 C16.6915026,11.5185644 17.1624089,11.5185644 17.1624089,12.0598307 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
        </svg>
      </button>
    </div>
  );
}
