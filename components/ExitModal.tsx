"use client";

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  schemeName: string;
  ministry: string;
  finalUrl: string;
  linkMeta: {
    emoji: string;
    label: string;
    color: string;
    warningMessage: string;
    status: string;
  };
}

export default function ExitModal({
  isOpen,
  onClose,
  onContinue,
  schemeName,
  ministry,
  finalUrl,
  linkMeta,
}: ExitModalProps) {
  if (!isOpen) return null;

  const isMyScheme =
    finalUrl.includes("myscheme.gov.in") ||
    linkMeta.status === "myscheme" ||
    linkMeta.status === "wiki";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: "1px solid #eef0f8",
          }}
        >
          <div
            style={{
              fontSize: 32,
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f0f4ff",
              borderRadius: 12,
              flexShrink: 0,
            }}
          >
            🏛️
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#002366",
                marginBottom: 2,
              }}
            >
              Leaving YojanaAI
            </div>
            <div style={{ fontSize: 12, color: "#8898aa" }}>
              You are being redirected to an external site
            </div>
          </div>
        </div>

        {/* Scheme info */}
        <div
          style={{
            background: "#f8f9ff",
            border: "1px solid #dde4f0",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <div
            style={{ fontSize: 14, fontWeight: 700, color: "#002366", marginBottom: 4 }}
          >
            {schemeName}
          </div>
          <div style={{ fontSize: 12, color: "#6b7a99" }}>🏢 {ministry}</div>
        </div>

        {/* Link status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: linkMeta.status === "ssl_issue" ? "#fff3cd" :
              linkMeta.status === "live" ? "#edfbf3" : "#e3effe",
            color: linkMeta.color,
            border: `1px solid ${linkMeta.color}40`,
            borderRadius: 99,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          {linkMeta.emoji} {linkMeta.label}
        </div>

        {/* Warning message */}
        <div
          style={{
            fontSize: 13,
            color: "#374567",
            lineHeight: 1.7,
            marginBottom: 16,
            padding: "10px 14px",
            background: linkMeta.status === "ssl_issue" ? "#fff8e6" :
              linkMeta.status === "live" ? "#f0fff4" : "#f0f4ff",
            borderLeft: `3px solid ${
              linkMeta.status === "ssl_issue" ? "#f59e0b" :
              linkMeta.status === "live" ? "#138808" : "#1565c0"
            }`,
            borderRadius: "0 6px 6px 0",
          }}
        >
          {linkMeta.warningMessage}
        </div>

        {/* Destination URL */}
        <div
          style={{
            fontSize: 11,
            color: "#8898aa",
            marginBottom: 20,
            wordBreak: "break-all",
          }}
        >
          Destination:{" "}
          <span style={{ color: "#1565c0" }}>
            {finalUrl.slice(0, 60)}
            {finalUrl.length > 60 ? "..." : ""}
          </span>
        </div>

        {/* SSL specific help */}
        {linkMeta.status === "ssl_issue" && (
          <div
            style={{
              background: "#fff3cd",
              border: "1px solid #f59e0b",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: "#92400e",
              marginBottom: 16,
            }}
          >
            💡 <strong>If you see a browser warning:</strong> Click
            &quot;Advanced&quot; → &quot;Proceed to site&quot;. This is a
            government server issue, not a security risk.
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: 8,
              border: "1px solid #dde4f0",
              background: "#f8f9ff",
              color: "#374567",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Go Back
          </button>
          <button
            onClick={onContinue}
            style={{
              flex: 2,
              padding: "11px 16px",
              borderRadius: 8,
              border: "none",
              background: isMyScheme ? "#1565c0" : "#002366",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isMyScheme
              ? "🔍 Search on MyScheme.gov.in →"
              : "Continue to Official Site →"}
          </button>
        </div>

        {/* Footer disclaimer */}
        <div
          style={{
            marginTop: 14,
            fontSize: 11,
            color: "#aab0c4",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          ⚠️ YojanaAI is not responsible for external government portal
          availability or content.
          <br />
          For assistance visit your nearest CSC / Jan Seva Kendra.
        </div>
      </div>
    </div>
  );
}
