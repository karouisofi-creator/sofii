export default function ChatInput({
  input,
  setInput,
  messages,
  setMessages,
  loading,
  setLoading,
  inputRef,
  setUnread,
}) {
  const SYSTEM_PROMPT = `Tu es l'assistant IA de DataFlow Assurance...`;

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    const userMsg = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: newMessages }),
      });
      const data = await res.json();
      const reply = data.reply || "⚠️ Pas de réponse de l'IA";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      setUnread((n) => n + 1);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "⚠️ Erreur de connexion. Veuillez réessayer.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        padding: "10px 12px",
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Votre question..."
        rows={1}
        style={{
          flex: 1,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(110,231,183,0.2)",
          borderRadius: 10,
          color: "#ecfdf5",
          padding: "8px 12px",
        }}
      />
      <button
        onClick={() => sendMessage()}
        disabled={loading || !input.trim()}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "#059669",
          color: "#fff",
        }}
      >
        ➤
      </button>
    </div>
  );
}
