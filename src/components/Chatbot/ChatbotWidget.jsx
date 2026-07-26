import { useState, useRef, useEffect } from "react";

function sourceLabel(source) {
  if (source === "vidal") return "Source: Base Vidal intégrée";
  if (source === "kb" || source === "local") return "Source: Base intégrée";
  if (source === "groq") return "Source: Connaissance médicale externe (Groq)";
  return null;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Posez votre question sur les codes ICD ou les soins, je réponds à partir de la base intégrée.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [openRefsIndex, setOpenRefsIndex] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  function copyToClipboard(text, key) {
    if (!text) return;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newHistory = [...messages, userMessage];

    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/public-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!res.ok) throw new Error("Erreur réseau");

      const data = await res.json().catch(() => ({}));
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content:
            data.combinedHtml || data.reply || "⚠️ Pas de réponse de l'IA",
          source: data.source || null,
          sources: data.sources || null,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: "❌ Impossible de joindre le serveur du chatbot Excel.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 mb-4 overflow-hidden flex flex-col h-[520px] max-h-[calc(100vh-120px)] transition-all animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-5 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">DataFlow IA</h3>
                <p className="text-xs text-blue-200 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Assistant actif
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-white/80 hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex max-w-[85%] ${msg.role === "user" ? "ml-auto justify-end" : "mr-auto justify-start"}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none shadow-md hover:shadow-lg"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm hover:shadow-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="space-y-2">
                      {sourceLabel(msg.source) && (
                        <div
                          className={`inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            msg.source === "groq"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          <svg
                            className="w-3 h-3 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          {sourceLabel(msg.source)}
                        </div>
                      )}
                      <div dangerouslySetInnerHTML={{ __html: msg.content }} />

                      {/* Voir références */}
                      {Array.isArray(msg.sources) && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <button
                            onClick={() =>
                              setOpenRefsIndex(
                                openRefsIndex === idx ? null : idx,
                              )
                            }
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                          >
                            <svg
                              className="w-3 h-3 fill-current"
                              viewBox="0 0 24 24"
                            >
                              <path d="M7 10l5 5 5-5z" />
                            </svg>
                            {openRefsIndex === idx
                              ? "Masquer références"
                              : "Voir références"}
                          </button>

                          {openRefsIndex === idx && (
                            <div className="mt-3 p-3 rounded-lg bg-slate-100 border border-slate-300 space-y-2 text-[12px]">
                              {msg.sources.map((s, si) => (
                                <div key={si} className="space-y-1.5">
                                  <div className="font-bold text-slate-800">
                                    {s.label}
                                  </div>
                                  {Array.isArray(s.items) &&
                                  s.items.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {s.items.map((it, k) => (
                                        <div
                                          key={k}
                                          className="bg-white p-2 rounded border border-slate-200"
                                        >
                                          <div className="flex items-center gap-2">
                                            <strong className="text-slate-700">
                                              {it.title}
                                            </strong>
                                            {s.type === "groq" &&
                                              it.snippet && (
                                                <>
                                                  <button
                                                    onClick={() =>
                                                      copyToClipboard(
                                                        String(it.snippet),
                                                        `${idx}-${si}-${k}`,
                                                      )
                                                    }
                                                    className="ml-auto text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200"
                                                  >
                                                    Copier
                                                  </button>
                                                  {copiedKey ===
                                                    `${idx}-${si}-${k}` && (
                                                    <span className="text-green-600 font-semibold">
                                                      OK
                                                    </span>
                                                  )}
                                                </>
                                              )}
                                          </div>
                                          {it.snippet && (
                                            <div className="mt-1 text-slate-600 text-[11px] break-words">
                                              {it.snippet}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-slate-600">
                                      Contenu disponible
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex max-w-[85%] mr-auto justify-start">
                <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-white border-t border-slate-200"
          >
            <div className="relative flex items-end gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 pl-4 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md"
                title="Envoyer"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4429026 C0.994623095,2.0851346 0.837654326,3.0274189 1.15159189,3.97788971 L3.03521743,10.4188827 C3.03521743,10.5759801 3.03521743,10.7330775 3.50612381,10.7330775 L16.6915026,11.5185644 C16.6915026,11.5185644 17.1624089,11.5185644 17.1624089,12.0598307 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all hover:scale-110 active:scale-95 ${
          isOpen
            ? "bg-gradient-to-br from-slate-800 to-slate-900"
            : "bg-gradient-to-br from-blue-600 to-blue-700"
        } text-white hover:shadow-2xl`}
        title="Assistant DataFlow"
      >
        {isOpen ? (
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
