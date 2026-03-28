"use client";
import { useState } from "react";
import type { MatchedScheme } from "@/types";
import { CAT_META } from "@/lib/constants";
import ExitModal from "@/components/ExitModal";
import { classifyLink, getFinalUrl } from "@/lib/link-utils";

interface SchemeCardProps {
  result: MatchedScheme;
  index: number;
  onAddCompare?: (scheme: MatchedScheme["scheme"]) => void;
  compareCount?: number;
  inCompareList?: boolean;
}

export default function SchemeCard({ result, index, onAddCompare, compareCount = 0, inCompareList = false }: SchemeCardProps) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { scheme: s, confidence, reasons } = result;

  const applyUrl = s.apply_link || "";
  const linkMeta = classifyLink(applyUrl, (s as any).url_status);
  const finalUrl = getFinalUrl(applyUrl, s.name);
  const cat = s.category || "General";
  const cm  = CAT_META[cat] || CAT_META["General"];
  const barCls = confidence >= 75 ? "fill-high" : confidence >= 50 ? "fill-mid" : "fill-low";
  const pctColor = confidence >= 75 ? "#138808" : confidence >= 50 ? "#f59e0b" : "#94a3b8";

  return (
    <div className="scheme-card">
      {/* TOP ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            <span className="pill pill-blue">{cm.icon} {cat}</span>
            {s.state !== "Central" ? (
              <span className="pill pill-green">{s.state}</span>
            ) : (
              <span className="pill pill-gray">🇮🇳 Central</span>
            )}
            {s.data_quality === "verified" && (
              <span className="pill" style={{ background: "#edfbf3", color: "#155d2b", border: "1px solid #a8d5b8" }}>✓ Verified</span>
            )}
          </div>
          <div className="scheme-title">{s.name}</div>
          <div className="scheme-ministry">🏢 {s.ministry}</div>
          <div style={{ marginTop: 6, marginBottom: 2 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: linkMeta.color,
              background: linkMeta.bg,
              border: `1px solid ${linkMeta.color}40`,
              borderRadius: 99,
              padding: "2px 8px",
            }}>
              {linkMeta.emoji} {linkMeta.label}
            </span>
          </div>
        </div>
        <div className="scheme-rank">#{index + 1}</div>
      </div>

      {/* MATCH BAR */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "14px 0" }}>
        {/* Circular confidence badge */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: `conic-gradient(${pctColor} ${confidence * 3.6}deg, #eef2fa ${confidence * 3.6}deg)`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: pctColor,
          }}>
            {confidence}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "#8898aa", fontWeight: 600, marginBottom: 4 }}>Eligibility Match</div>
          <div className="match-track">
            <div className={`match-fill ${barCls}`} style={{ width: `${confidence}%` }} />
          </div>
        </div>
      </div>

      {/* REASON PILLS */}
      {reasons.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {reasons.slice(0, 3).map((r, i) => (
            <span key={i} className="pill pill-check">✓ {r}</span>
          ))}
        </div>
      )}

      {/* DESCRIPTION */}
      <p className="scheme-desc">
        {s.description?.slice(0, 230)}{(s.description?.length || 0) > 230 ? "..." : ""}
      </p>

      {/* EXPAND TOGGLE */}
      <button
        onClick={() => setOpen(!open)}
        className="expander-trigger"
        style={{ marginTop: 10, borderRadius: 8 }}
      >
        <span>📄 Details & Apply — {s.name?.slice(0, 45)}</span>
        <span style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div className="expander-content" style={{ border: "1px solid #dde4f0", borderTop: "none", borderRadius: "0 0 8px 8px", background: "#fafbff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#002366", marginBottom: 8 }}>✅ Benefits / लाभ</p>
              {(s.benefits || []).slice(0, 4).map((b, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#374567", padding: "4px 0", borderBottom: "1px solid #f4f6fa" }}>
                  <span style={{ color: "#138808", flexShrink: 0 }}>•</span>
                  <span>{b}</span>
                </div>
              ))}

              <p style={{ fontWeight: 700, fontSize: 13, color: "#002366", margin: "14px 0 8px" }}>📋 Eligibility / पात्रता</p>
              {(s.eligibility_criteria || []).slice(0, 4).map((e, i) => (
                <div key={i} style={{ fontSize: 13, color: "#374567", padding: "4px 0", borderBottom: "1px solid #f4f6fa" }}>• {e}</div>
              ))}
            </div>

            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#002366", marginBottom: 8 }}>📎 Documents / दस्तावेज़</p>
              {(s.documents_required || []).slice(0, 6).map((d, i) => (
                <div key={i} style={{ fontSize: 13, color: "#374567", padding: "4px 0", borderBottom: "1px solid #f4f6fa" }}>• {d}</div>
              ))}
              <p style={{ fontSize: 12, color: "#8898aa", marginTop: 12 }}>Ministry: {s.ministry}</p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowModal(true)}
              className="apply-link"
              style={{ border: "none", cursor: "pointer" }}
            >
              🔗 Apply Now / आवेदन करें
            </button>
            <button
              className="btn-outline btn-sm"
              onClick={() => {
                const applyUrl = s.apply_link || '#';
                const msg = `🏛️ *${s.name}*\n\n` +
                  `✅ ${s.benefits?.[0] || 'Government benefit scheme'}\n\n` +
                  `📎 Documents: ${(s.documents_required || []).slice(0, 3).join(', ')}\n\n` +
                  `🔗 Apply: ${applyUrl}\n\n` +
                  `_YojanaAI — आपकी योजना, आपकी आवाज़_`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              style={{ background: '#25D366', color: '#fff', border: 'none' }}
            >
              📲 Share on WhatsApp
            </button>
            <a
              href={`/chat?scheme=${encodeURIComponent(s.name)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#e8f0fe",
                color: "#1a56db",
                border: "1px solid #93c5fd",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              💬 Ask AI about this scheme
            </a>
            {onAddCompare && (
              <button
                className="btn-outline btn-sm"
                onClick={() => onAddCompare(s)}
                disabled={inCompareList || compareCount >= 3}
                style={{ opacity: inCompareList || compareCount >= 3 ? 0.5 : 1 }}
              >
                {inCompareList ? "✓ In Compare" : "⚖️ Compare"}
              </button>
            )}
          </div>
        </div>
      )}

      <ExitModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onContinue={() => {
          setShowModal(false);
          window.open(finalUrl, "_blank", "noopener,noreferrer");
        }}
        schemeName={s.name}
        ministry={s.ministry}
        finalUrl={finalUrl}
        linkMeta={linkMeta}
      />
    </div>
  );
}