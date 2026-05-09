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
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 68,
        right: 0,
        width: 360,
        height: 520,
        borderRadius: 16,
        background: "#0d1f16",
        border: "1px solid rgba(110,231,183,0.18)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "df-pop 0.2s ease",
      }}
    >
      <ChatHeader setMessages={setMessages} />
      <ChatMessages
        messages={messages}
        loading={loading}
        messagesEndRef={messagesEndRef}
      />
      {messages.length === 1 && <Suggestions setInput={setInput} />}
      <ChatInput
        input={input}
        setInput={setInput}
        messages={messages}
        setMessages={setMessages}
        loading={loading}
        setLoading={setLoading}
        messagesEndRef={messagesEndRef}
        inputRef={inputRef}
        setUnread={setUnread}
      />
    </div>
  );
}
