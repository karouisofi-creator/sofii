import { useState, useRef, useEffect } from "react";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Bonjour ! 👋 Comment puis-je vous aider avec DataFlow Assurance ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}>
      <ChatButton open={open} setOpen={setOpen} unread={unread} />
      {open && (
        <ChatWindow
          messages={messages}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          loading={loading}
          setLoading={setLoading}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
          setUnread={setUnread}
        />
      )}
    </div>
  );
}
