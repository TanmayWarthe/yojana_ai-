"use client";
import { useState, useRef, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const COMMON_SCHEMES = [
  "PM-KISAN (Farmer Income Support)",
  "Ayushman Bharat PM-JAY (Health Insurance)",
  "PMAY-G (Rural Housing)",
  "PMAY-U (Urban Housing)",
  "MUDRA Loan (Business)",
  "NSP Scholarship (Education)",
  "MGNREGA (Employment)",
  "PM Ujjwala Yojana (LPG Connection)",
  "Sukanya Samriddhi Yojana (Girl Child)",
  "PMJDY (Jan Dhan Account)",
  "Ladki Bahin Yojana MH (₹1500/month)",
  "MJPJAY Maharashtra (Health ₹1.5L)",
  "Other / General Check",
];

const LANGUAGES = ["English", "हिंदी", "मराठी"];

// Scheme to required documents mapping
const SCHEME_DOCS: Record<string, string[]> = {
  "PM-KISAN (Farmer Income Support)": [
    "Aadhaar Card",
    "Bank Account (activated on PMJDY)",
    "Land ownership proof",
    "Application form",
  ],
  "Ayushman Bharat PM-JAY (Health Insurance)": [
    "Aadhaar Card (family head)",
    "Ration Card",
    "Income Certificate",
    "Bank account details",
  ],
  "PMAY-G (Rural Housing)": [
    "Aadhaar Card",
    "House allocation letter",
    "Bank account",
    "Income certificate",
  ],
  "PMAY-U (Urban Housing)": [
    "Aadhaar Card",
    "Income certificate",
    "Property ownership proof",
    "Bank account",
  ],
  "MUDRA Loan (Business)": [
    "Business plan",
    "Bank statement",
    "IT Return / Income proof",
    "Aadhaar + PAN",
  ],
  "NSP Scholarship (Education)": [
    "Student registration ID",
    "College / University ID",
    "Income certificate (family)",
    "Caste certificate (if applicable)",
  ],
  "MGNREGA (Employment)": [
    "Aadhaar Card",
    "BPL / APL card",
    "Job card",
    "Bank account",
  ],
  "PM Ujjwala Yojana (LPG Connection)": [
    "Aadhaar Card",
    "Bank account proof",
    "Signature / Thumb impression",
    "Address proof",
  ],
  "Sukanya Samriddhi Yojana (Girl Child)": [
    "Girl child birth certificate",
    "Parent ID proof (Aadhaar)",
    "Guardian bank account",
    "KYC documents",
  ],
  "PMJDY (Jan Dhan Account)": [
    "Aadhaar Card",
    "Address proof",
    "Signature / Thumb impression",
    "Photos (if required)",
  ],
  "Ladki Bahin Yojana MH (₹1500/month)": [
    "Aadhaar Card",
    "Domicile proof (Maharashtra)",
    "Income certificate",
    "Bank account",
  ],
  "MJPJAY Maharashtra (Health ₹1.5L)": [
    "Aadhaar Card",
    "BPL / APL card",
    "Domicile proof",
    "Bank account",
  ],
};

export default function DocCheckPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scheme, setScheme] = useState(COMMON_SCHEMES[0]);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Parse verdict counts from AI response
  const verdictCounts = useMemo(() => {
    if (!result) return { valid: 0, warnings: 0, issues: 0 };
    return {
      valid: (result.match(/✅/g) || []).length,
      warnings: (result.match(/⚠️/g) || []).length,
      issues: (result.match(/❌/g) || []).length,
    };
  }, [result]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP)");
      return;
    }
    setImage(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleCheck() {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("image", image);
      fd.append("scheme_name", scheme);
      fd.append("language", language);

      const res = await fetch("/api/check-document", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed. Please try again.");
      } else {
        setResult(data.analysis);
      }
    } catch {
      setError("Network error. Please check your connection.");
    }

    setLoading(false);
  }

  // Format AI response into structured verdict cards
  function formatResult(text: string) {
    const lines = text.split("\n").filter((l) => l.trim());
    const cards: Array<{ type: "success" | "warning" | "error" | "info"; title: string; items: string[] }> = [];
    let currentCard: { type: "success" | "warning" | "error" | "info"; title: string; items: string[] } | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Detect card headers
      if (trimmed.startsWith("✅") || trimmed.toLowerCase().includes("valid") && trimmed.startsWith("📄")) {
        if (currentCard) cards.push(currentCard);
        currentCard = {
          type: "success",
          title: trimmed.replace(/^✅\s*/, "").replace(/^📄\s*/, ""),
          items: [],
        };
      } else if (trimmed.startsWith("⚠️") || trimmed.startsWith("👁️")) {
        if (currentCard) cards.push(currentCard);
        currentCard = {
          type: "warning",
          title: trimmed.replace(/^⚠️\s*/, "").replace(/^👁️\s*/, ""),
          items: [],
        };
      } else if (trimmed.startsWith("❌") || trimmed.startsWith("🎯")) {
        if (currentCard) cards.push(currentCard);
        currentCard = {
          type: "error",
          title: trimmed.replace(/^❌\s*/, "").replace(/^🎯\s*/, ""),
          items: [],
        };
      } else if (trimmed.startsWith("💡")) {
        if (currentCard) cards.push(currentCard);
        currentCard = {
          type: "info",
          title: trimmed.replace(/^💡\s*/, ""),
          items: [],
        };
      } else if (currentCard && trimmed) {
        // Add to current card items
        currentCard.items.push(trimmed);
      }
    });

    if (currentCard) cards.push(currentCard);

    return (
      <>
        {/* Summary pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {verdictCounts.valid > 0 && (
            <div
              style={{
                background: "#edfbf3",
                border: "1px solid #a8d5b8",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#155d2b",
              }}
            >
              ✅ {verdictCounts.valid} Valid
            </div>
          )}
          {verdictCounts.warnings > 0 && (
            <div
              style={{
                background: "#fff8e6",
                border: "1px solid #fcd34d",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#92400e",
              }}
            >
              ⚠️ {verdictCounts.warnings} Warnings
            </div>
          )}
          {verdictCounts.issues > 0 && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#dc2626",
              }}
            >
              ❌ {verdictCounts.issues} Issues
            </div>
          )}
        </div>

        {/* Verdict cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cards.map((card, i) => {
            const borderColors = {
              success: "#138808",
              warning: "#f59e0b",
              error: "#dc2626",
              info: "#002366",
            };
            const bgColors = {
              success: "#edfbf3",
              warning: "#fff8e6",
              error: "#fee2e2",
              info: "#f0f4ff",
            };
            const textColors = {
              success: "#155d2b",
              warning: "#92400e",
              error: "#991b1b",
              info: "#1e3a8a",
            };
            const icons = {
              success: "✅",
              warning: "⚠️",
              error: "❌",
              info: "💡",
            };

            return (
              <div
                key={i}
                style={{
                  border: `3px solid ${borderColors[card.type]}`,
                  borderLeft: `6px solid ${borderColors[card.type]}`,
                  borderRadius: 10,
                  background: bgColors[card.type],
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: textColors[card.type],
                    marginBottom: card.items.length > 0 ? 8 : 0,
                  }}
                >
                  {icons[card.type]} {card.title}
                </div>
                {card.items.length > 0 && (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      fontSize: 13,
                      color: textColors[card.type],
                      listStyle: "disc",
                    }}
                  >
                    {card.items.map((item, j) => (
                      <li key={j} style={{ margin: "4px 0" }}>
                        {item.replace(/^[-•]\s*/, "")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <div className="page-wrap">

          <div className="section-title">
            📎 Document Checker
            <small>दस्तावेज़ जाँचें — AI verifies your documents instantly</small>
          </div>

          <div className="box box-info">
            📸 <strong>Upload any government document</strong> — Aadhaar, income certificate,
            ration card, caste certificate — and our AI will check if it is valid and
            complete for your selected scheme. <strong>80% of scheme rejections happen
            due to wrong documents.</strong> We solve this.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* LEFT — Upload + Settings */}
            <div>
              <div className="form-section">
                <div className="form-section-title">📋 Select Scheme to Check For</div>
                <div className="form-group">
                  <label className="form-label">Scheme / योजना</label>
                  <select className="form-select" value={scheme}
                    onChange={(e) => {
                      setScheme(e.target.value);
                      setCheckedDocs({});
                    }}>
                    {COMMON_SCHEMES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">Response Language</label>
                  <select className="form-select" value={language}
                    onChange={(e) => setLanguage(e.target.value)}>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "2px dashed #9fa8da",
                  borderRadius: 12,
                  padding: "32px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#f8f9ff",
                  transition: "border-color 0.2s",
                  marginBottom: 12,
                }}
              >
                {preview ? (
                  <img src={preview} alt="Document preview"
                    style={{ maxHeight: 200, maxWidth: "100%",
                      borderRadius: 8, objectFit: "contain" }} />
                ) : (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                    <div style={{ fontWeight: 600, color: "#002366", marginBottom: 6 }}>
                      Click to upload or drag & drop
                    </div>
                    <div style={{ fontSize: 13, color: "#8898aa" }}>
                      JPG, PNG, WEBP — max 4MB
                    </div>
                  </>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {/* Camera capture for mobile */}
              <input ref={cameraRef} type="file" accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <button className="btn-outline btn-sm"
                  onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}>
                  📷 Take Photo
                </button>
                <button className="btn-outline btn-sm"
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>
                  📁 Choose File
                </button>
              </div>

              {image && (
                <div style={{ marginTop: 10, fontSize: 13, color: "#556080" }}>
                  📎 {image.name} ({(image.size / 1024).toFixed(0)} KB)
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleCheck}
                disabled={!image || loading}
                style={{ width: "100%", marginTop: 16,
                  fontSize: 15, padding: "13px 24px" }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 10 }}>
                    <span className="spinner" />
                    AI analyzing document...
                  </span>
                ) : "🔍 Check Document / दस्तावेज़ जाँचें"}
              </button>
            </div>

            {/* RIGHT — Documents Checklist / Results */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Document Checklist */}
              {SCHEME_DOCS[scheme] && (
                <div style={{
                  background: "#f8f9ff",
                  border: "1px solid #dde4f0",
                  borderRadius: 12,
                  padding: "14px 16px",
                }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#002366",
                    marginBottom: 12,
                  }}>
                    📋 Required Documents
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {SCHEME_DOCS[scheme].map((doc) => (
                      <label key={doc} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12,
                        cursor: "pointer",
                        padding: "8px 10px",
                        background: checkedDocs[doc] ? "#e8eef8" : "transparent",
                        borderRadius: 6,
                        transition: "background 0.15s",
                      }}>
                        <input
                          type="checkbox"
                          checked={checkedDocs[doc] || false}
                          onChange={(e) => {
                            setCheckedDocs({
                              ...checkedDocs,
                              [doc]: e.target.checked,
                            });
                          }}
                          style={{
                            width: 16,
                            height: 16,
                            cursor: "pointer",
                          }}
                        />
                        <span style={{
                          fontWeight: checkedDocs[doc] ? 700 : 500,
                          color: checkedDocs[doc] ? "#002366" : "#556080",
                          textDecoration: checkedDocs[doc] ? "line-through" : "none",
                        }}>
                          {doc}
                        </span>
                        {checkedDocs[doc] && (
                          <span style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            color: "#138808",
                          }}>
                            ✓
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  <div style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: "#8898aa",
                    padding: "8px 10px",
                    background: "#f0f4ff",
                    borderRadius: 6,
                  }}>
                    {Object.values(checkedDocs).filter(Boolean).length} of {SCHEME_DOCS[scheme].length} documents ready
                  </div>
                </div>
              )}

              {/* Results */}
              {!result && !error && !loading && (
                <div style={{ background: "#f8f9ff", border: "1px solid #dde4f0",
                  borderRadius: 12, padding: 24, textAlign: "center",
                  height: "100%", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ fontSize: 48 }}>🔍</div>
                  <div style={{ fontWeight: 600, color: "#002366", fontSize: 15 }}>
                    Upload a document to check
                  </div>
                  <div style={{ fontSize: 13, color: "#8898aa", maxWidth: 280 }}>
                    AI will verify Aadhaar, income certificate, ration card,
                    caste certificate and more
                  </div>
                  <div style={{ display: "flex", flexDirection: "column",
                    gap: 8, marginTop: 8, width: "100%" }}>
                    {["✅ Aadhaar Card", "✅ Income Certificate",
                      "✅ Ration Card", "✅ Caste Certificate",
                      "✅ Land Records", "✅ Bank Passbook"].map((d) => (
                      <div key={d} style={{ fontSize: 13, color: "#556080",
                        background: "#edf0f8", padding: "6px 12px",
                        borderRadius: 6 }}>{d}</div>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div style={{ background: "#f8f9ff", border: "1px solid #dde4f0",
                  borderRadius: 12, padding: 40, textAlign: "center",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 16 }}>
                  <span className="spinner"
                    style={{ width: 36, height: 36, borderWidth: 3 }} />
                  <div style={{ fontWeight: 600, color: "#002366" }}>
                    AI is analyzing your document...
                  </div>
                  <div style={{ fontSize: 13, color: "#8898aa" }}>
                    Checking document type · Readability · Required fields
                  </div>
                </div>
              )}

              {error && (
                <div className="box box-warn">
                  ⚠️ {error}
                </div>
              )}

              {result && (
                <div style={{ background: "#fff", border: "1px solid #dde4f0",
                  borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ background: "#002366", color: "#fff",
                    padding: "12px 16px", fontWeight: 700, fontSize: 14 }}>
                    🤖 AI Document Analysis — {scheme.split("(")[0].trim()}
                  </div>
                  <div style={{ padding: "16px 12px" }}>
                    {formatResult(result)}
                  </div>
                  <div style={{ padding: "12px 16px",
                    borderTop: "1px solid #eef0f8",
                    display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn-outline btn-sm"
                      onClick={() => { setImage(null); setPreview(null);
                        setResult(null); setError(null); }}>
                      🔄 Check Another Document
                    </button>
                    <a href="/find" className="btn-outline btn-sm"
                      style={{ textDecoration: "none" }}>
                      🔍 Find More Schemes →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="box box-warn" style={{ marginTop: 20 }}>
            ⚠️ <strong>Privacy:</strong> Your document images are sent directly to
            Groq AI for analysis and are <strong>never stored</strong> on our servers.
            Analysis happens in real-time and images are discarded immediately.
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
