"use client";
import { useState, useRef } from "react";
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

export default function DocCheckPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scheme, setScheme] = useState(COMMON_SCHEMES[0]);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

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

  // Format AI response into styled sections
  function formatResult(text: string) {
    const lines = text.split("\n").filter(Boolean);
    return lines.map((line, i) => {
      const isHeader = line.startsWith("📄") || line.startsWith("👁️") ||
        line.startsWith("✅") || line.startsWith("🎯") ||
        line.startsWith("⚠️") || line.startsWith("💡");

      const isOk = line.includes("✅") || line.toLowerCase().includes("valid") ||
        line.toLowerCase().includes("clear") || line.toLowerCase().includes("sufficient");
      const isWarn = line.includes("⚠️") || line.toLowerCase().includes("missing") ||
        line.toLowerCase().includes("unclear") || line.toLowerCase().includes("issue");

      return (
        <div key={i} style={{
          padding: isHeader ? "10px 14px" : "6px 14px 6px 28px",
          background: isHeader
            ? (isOk ? "#edfbf3" : isWarn ? "#fff8e6" : "#f0f4ff")
            : "transparent",
          borderLeft: isHeader
            ? (isOk ? "3px solid #138808" : isWarn ? "3px solid #f59e0b" : "3px solid #002366")
            : "none",
          marginBottom: isHeader ? 8 : 2,
          borderRadius: isHeader ? "0 6px 6px 0" : 0,
          fontWeight: isHeader ? 600 : 400,
          fontSize: isHeader ? 14 : 13,
          color: isHeader
            ? (isOk ? "#155d2b" : isWarn ? "#92400e" : "#002366")
            : "#374567",
          lineHeight: 1.6,
        }}>
          {line}
        </div>
      );
    });
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
                    onChange={(e) => setScheme(e.target.value)}>
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

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}>
                  📷 Take Photo
                </button>
                <button className="btn-outline btn-sm"
                  style={{ flex: 1 }}
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

            {/* RIGHT — Results */}
            <div>
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
