import { useState } from "react";
import TypingDots from "./TypingDots";

function sourceLabel(source) {
  if (source === "vidal") return "Source: Base Vidal intégrée";
  if (source === "kb" || source === "local") return "Source: Base intégrée";
  if (source === "groq") return "Source: Connaissance médicale externe (Groq)";
  return null;
}

export default function ChatMessages({
  messages,
  loading,
  messagesEndRef,
  extraBottom = 10,
}) {
  const [openRefsIndex, setOpenRefsIndex] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showMoreMap, setShowMoreMap] = useState({});

  function copyToClipboard(text, key) {
    if (!text) return;
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    } else {
      // fallback
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
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: `14px 14px ${extraBottom}px`,
        background: "#f8fafc",
      }}
    >
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        const bubbleStyle = {
          maxWidth: "78%",
          padding: "12px 14px",
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isUser
            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            : "#ffffff",
          color: isUser ? "#fff" : "#1f2937",
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          boxShadow: isUser
            ? "0 4px 12px rgba(37, 99, 235, 0.25)"
            : "0 2px 8px rgba(2, 6, 23, 0.08)",
          transition: "all 0.18s",
          border: isUser ? "none" : "1px solid #e2e8f0",
        };

        const content = (() => {
          if (isUser) return msg.content;
          // Prefer combinedHtml from server (KB excerpts + Groq answer)
          if (msg.combinedHtml) return { __html: msg.combinedHtml };
          // If server provided a structured medHtml, render it
          if (msg.medHtml) return { __html: msg.medHtml };
          const raw = String(msg.content || "");
          // If the reply contains HTML tags, prefer rendering HTML
          if (/<[^>]+>/g.test(raw)) return { __html: raw };
          const oneLine = raw
            .replace(/<br\s*\/?\>/gi, " — ")
            .replace(/<[^>]+>/g, "");
          return oneLine.replace(/\s+/g, " ").trim();
        })();

        return (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: isUser ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            <div style={bubbleStyle}>
              {!isUser && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {Array.isArray(msg.sources) && msg.sources.length > 0
                    ? msg.sources.map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            background:
                              s.type === "groq"
                                ? "rgba(16,185,129,0.12)"
                                : "rgba(59,130,246,0.12)",
                            color: s.type === "groq" ? "#047857" : "#1d4ed8",
                            border:
                              s.type === "groq"
                                ? "1px solid rgba(16,185,129,0.25)"
                                : "1px solid rgba(59,130,246,0.25)",
                          }}
                        >
                          {s.label}
                        </div>
                      ))
                    : sourceLabel(msg.source) && (
                        <div
                          style={{
                            display: "inline-block",
                            marginBottom: 8,
                            padding: "3px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            background:
                              msg.source === "groq"
                                ? "rgba(16,185,129,0.12)"
                                : "rgba(59,130,246,0.12)",
                            color:
                              msg.source === "groq" ? "#047857" : "#1d4ed8",
                            border:
                              msg.source === "groq"
                                ? "1px solid rgba(16,185,129,0.25)"
                                : "1px solid rgba(59,130,246,0.25)",
                          }}
                        >
                          {sourceLabel(msg.source)}
                        </div>
                      )}
                </div>
              )}
              {typeof content === "string" && <span>{content}</span>}
              {typeof content === "object" && content.__html && (
                <div
                  dangerouslySetInnerHTML={content}
                  style={{ fontSize: 13, lineHeight: 1.45 }}
                />
              )}

              {/* Voir références button + panel */}
              {!isUser &&
                Array.isArray(msg.sources) &&
                msg.sources.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() =>
                        setOpenRefsIndex(openRefsIndex === i ? null : i)
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#2563eb",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                        marginTop: 6,
                      }}
                    >
                      {openRefsIndex === i
                        ? "Masquer les références"
                        : "Voir références"}
                    </button>

                    {openRefsIndex === i && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 10,
                          borderRadius: 8,
                          background: "#fbfbff",
                          border: "1px solid rgba(2,6,23,0.04)",
                          fontSize: 13,
                          color: "#0f172a",
                        }}
                      >
                        {msg.sources.map((s, si) => (
                          <div key={si} style={{ marginBottom: 8 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>
                              {s.label}
                            </div>
                            {Array.isArray(s.items) && s.items.length > 0 ? (
                              <div>
                                {s.items.map((it, k) => (
                                  <div key={k} style={{ marginBottom: 8 }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 8,
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                        }}
                                      >
                                        <strong>{it.title}</strong>
                                        {s.type === "groq" && it.snippet && (
                                          <>
                                            <button
                                              onClick={() =>
                                                copyToClipboard(
                                                  String(it.snippet),
                                                  `${i}-${si}-${k}`,
                                                )
                                              }
                                              style={{
                                                marginLeft: 8,
                                                padding: "4px 8px",
                                                fontSize: 12,
                                                borderRadius: 6,
                                                border:
                                                  "1px solid rgba(2,6,23,0.06)",
                                                background: "#ffffff",
                                                cursor: "pointer",
                                              }}
                                            >
                                              Copier la réponse Groq
                                            </button>
                                            {copiedKey ===
                                              `${i}-${si}-${k}` && (
                                              <span
                                                style={{
                                                  color: "#15803d",
                                                  fontSize: 12,
                                                  marginLeft: 6,
                                                }}
                                              >
                                                Copié !
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </div>

                                      {/* If raw data exists (full row), render filtered and highlighted fields */}
                                      {it.raw && Object.keys(it.raw).length ? (
                                        <div
                                          style={{
                                            marginTop: 6,
                                            color: "#374151",
                                          }}
                                        >
                                          {(() => {
                                            const entries = Object.entries(
                                              it.raw,
                                            ).filter(([field, val]) => {
                                              if (!field) return false;
                                              if (
                                                String(field || "").startsWith(
                                                  "__",
                                                )
                                              )
                                                return false;
                                              const s = String(
                                                val ?? "",
                                              ).trim();
                                              return (
                                                s !== "" &&
                                                s.toLowerCase() !== "null"
                                              );
                                            });

                                            const isImportant = (field) => {
                                              const f = String(
                                                field || "",
                                              ).toLowerCase();
                                              return (
                                                f.includes("icd") ||
                                                f.includes("soin") ||
                                                f.includes("acte") ||
                                                f === "spécialité" ||
                                                f === "icd à utiliser"
                                              );
                                            };

                                            // Pull out any ICD-related entry so we can render it first
                                            const icdIndex = entries.findIndex(
                                              ([f]) =>
                                                String(f || "")
                                                  .toLowerCase()
                                                  .includes("icd"),
                                            );
                                            let icdEntry = null;
                                            const remaining = entries.slice();
                                            if (icdIndex >= 0) {
                                              icdEntry = remaining.splice(
                                                icdIndex,
                                                1,
                                              )[0];
                                            }

                                            const important = remaining.filter(
                                              ([f]) => isImportant(f),
                                            );
                                            if (icdEntry)
                                              important.unshift(icdEntry);
                                            const others = remaining.filter(
                                              ([f]) => !isImportant(f),
                                            );
                                            const key = `${i}-${si}-${k}`;
                                            const showMore = !!showMoreMap[key];

                                            return (
                                              <div>
                                                {/* Important fields first (highlighted) */}
                                                {important.map(
                                                  ([field, val], idx2) => {
                                                    const isIcd = /icd/i.test(
                                                      String(field || ""),
                                                    );
                                                    return (
                                                      <div
                                                        key={idx2}
                                                        style={{
                                                          marginBottom: 6,
                                                        }}
                                                      >
                                                        <strong
                                                          style={{
                                                            fontWeight: isIcd
                                                              ? 900
                                                              : 800,
                                                            marginRight: 8,
                                                            color: isIcd
                                                              ? "#0b4db6"
                                                              : "#1d4ed8",
                                                            fontSize: isIcd
                                                              ? 15
                                                              : 13,
                                                          }}
                                                        >
                                                          {field}:
                                                        </strong>
                                                        <span
                                                          style={{
                                                            fontWeight: isIcd
                                                              ? 800
                                                              : 700,
                                                            fontSize: isIcd
                                                              ? 14
                                                              : 13,
                                                          }}
                                                        >
                                                          {String(
                                                            val ?? "",
                                                          ).trim()}
                                                        </span>
                                                      </div>
                                                    );
                                                  },
                                                )}

                                                {/* Others: show preview or full list with toggle */}
                                                {others.length > 0 && (
                                                  <div style={{ marginTop: 6 }}>
                                                    {showMore ? (
                                                      <div>
                                                        {others.map(
                                                          (
                                                            [field, val],
                                                            idx3,
                                                          ) => (
                                                            <div
                                                              key={idx3}
                                                              style={{
                                                                marginBottom: 6,
                                                              }}
                                                            >
                                                              <strong
                                                                style={{
                                                                  fontWeight: 700,
                                                                  marginRight: 6,
                                                                }}
                                                              >
                                                                {field}:
                                                              </strong>
                                                              <span>
                                                                {String(
                                                                  val ?? "",
                                                                ).trim()}
                                                              </span>
                                                            </div>
                                                          ),
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <div
                                                        style={{
                                                          color: "#6b7280",
                                                          fontSize: 13,
                                                        }}
                                                      >
                                                        {others
                                                          .slice(0, 3)
                                                          .map(
                                                            (
                                                              [field, val],
                                                              idx3,
                                                            ) => (
                                                              <div
                                                                key={idx3}
                                                                style={{
                                                                  marginBottom: 4,
                                                                }}
                                                              >
                                                                <strong
                                                                  style={{
                                                                    fontWeight: 700,
                                                                    marginRight: 6,
                                                                  }}
                                                                >
                                                                  {field}:
                                                                </strong>
                                                                <span>
                                                                  {String(
                                                                    val ?? "",
                                                                  ).trim()}
                                                                </span>
                                                              </div>
                                                            ),
                                                          )}
                                                      </div>
                                                    )}

                                                    <button
                                                      onClick={() =>
                                                        setShowMoreMap((m) => ({
                                                          ...m,
                                                          [key]: !m[key],
                                                        }))
                                                      }
                                                      style={{
                                                        marginTop: 6,
                                                        padding: "6px 8px",
                                                        fontSize: 12,
                                                        borderRadius: 6,
                                                        border:
                                                          "1px solid rgba(2,6,23,0.06)",
                                                        background: "#fff",
                                                        cursor: "pointer",
                                                      }}
                                                    >
                                                      {showMore
                                                        ? "Afficher moins"
                                                        : `Afficher ${others.length} champs`}
                                                    </button>
                                                  </div>
                                                )}

                                                {/* show sheet name if present (internal __sheet) */}
                                                {it.raw.__sheet && (
                                                  <div style={{ marginTop: 6 }}>
                                                    <em
                                                      style={{
                                                        fontSize: 12,
                                                        color: "#6b7280",
                                                      }}
                                                    >
                                                      Feuille: {it.raw.__sheet}
                                                    </em>
                                                  </div>
                                                )}

                                                {/* copy full raw JSON */}
                                                <div style={{ marginTop: 8 }}>
                                                  <button
                                                    onClick={() =>
                                                      copyToClipboard(
                                                        JSON.stringify(
                                                          it.raw,
                                                          null,
                                                          2,
                                                        ),
                                                        `${i}-${si}-json`,
                                                      )
                                                    }
                                                    style={{
                                                      padding: "6px 8px",
                                                      fontSize: 12,
                                                      borderRadius: 6,
                                                      border:
                                                        "1px solid rgba(2,6,23,0.06)",
                                                      background: "#fff",
                                                      cursor: "pointer",
                                                    }}
                                                  >
                                                    Copier la ligne (JSON)
                                                  </button>
                                                  {copiedKey ===
                                                    `${i}-${si}-json` && (
                                                    <span
                                                      style={{
                                                        color: "#15803d",
                                                        fontSize: 12,
                                                        marginLeft: 8,
                                                      }}
                                                    >
                                                      Copié !
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      ) : it.snippet ? (
                                        <div
                                          style={{
                                            marginTop: 6,
                                            color: "#374151",
                                            whiteSpace: "pre-wrap",
                                          }}
                                        >
                                          {it.snippet}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 13, color: "#6b7280" }}>
                                Contenu externe disponible
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        );
      })}

      {loading && <TypingDots />}
      <div ref={messagesEndRef} />
    </div>
  );
}
