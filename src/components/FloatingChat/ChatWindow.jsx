import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import Suggestions from "./Suggestions";

export default function ChatWindow({
  messages,
  setMessages,
  input,
  setInput,
  loading,
  setLoading,
  messagesEndRef,
  inputRef,
  setUnread,
  setOpen,
}) {
  const sendMessage = async (text) => {
    const userText = (text || input || "").trim();
    if (!userText || loading) return;
    setInput("");
    const userMsg = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/public-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = res.ok
        ? data.reply || "⚠️ Pas de réponse de l'IA"
        : data.error || "⚠️ Erreur de connexion. Veuillez réessayer.";

      const assistantMsg = {
        role: "assistant",
        content: data.combinedHtml || reply,
        med: data.med || null,
        medHtml: data.medHtml || null,
        source: data.source || null,
        sources: data.sources || null,
        refs: data.refs || [],
      };

      setMessages((prev) => [...newMessages, assistantMsg]);
      setUnread((n) => n + 1);
    } catch (e) {
      setMessages((prev) => [
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

  return (
    <div
      style={{
        position: "absolute",
        bottom: 78,
        right: 0,
        width: 360,
        height: 540,
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 20px 50px rgba(2, 6, 23, 0.15)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "df-pop 0.14s ease",
      }}
    >
      <ChatHeader setMessages={setMessages} setOpen={setOpen} />
      {/** when suggestions are visible, reserve extra bottom space in messages area */}
      {(() => {
        const suggestionsVisible = messages.length === 1;
        return (
          <>
            <ChatMessages
              messages={messages}
              loading={loading}
              messagesEndRef={messagesEndRef}
              extraBottom={suggestionsVisible ? 140 : 10}
            />
            {suggestionsVisible && (
              <Suggestions setInput={setInput} sendMessage={sendMessage} />
            )}
          </>
        );
      })()}
      <ChatInput
        input={input}
        setInput={setInput}
        loading={loading}
        inputRef={inputRef}
        sendMessage={sendMessage}
      />
    </div>
  );
}
