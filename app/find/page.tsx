"use client";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SchemeCard from "@/components/schemes/SchemeCard";
import { eligibilityEngine } from "@/lib/eligibility";
import { STATES, OCCUPATIONS, CATEGORIES } from "@/lib/constants";
import type { CitizenProfile, MatchedScheme, Scheme } from "@/types";

const SCAN_STEPS = [
  "🔌 Initializing AI Engine...",
  "📡 Analyzing Profile Data...",
  "📊 Scanning 219+ Government Schemes...",
  "🤖 Calculating Eligibility Matches...",
  "✅ Preparing Your Results...",
];

const DEFAULT_PROFILE: CitizenProfile = {
  name: "Ramu",
  age: 45,
  gender: "Male",
  state: "Maharashtra",
  occupation: "farmer",
  income: 80000,
  category: "sc",
  bpl: true,
  has_land: true,
  disabled: false,
};

export default function FindPage() {
  const [profile, setProfile]     = useState<CitizenProfile>(DEFAULT_PROFILE);
  const [results, setResults]     = useState<MatchedScheme[]>([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [searchMode, setSearchMode] = useState<"ml" | "rule">("ml");
  const [compareList, setCompareList] = useState<Scheme[]>([]);
  const [filterCat, setFilterCat] = useState("All");
  const [showN, setShowN]         = useState(10);
  const [scanStep, setScanStep]   = useState(0);
  const scanRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading) {
      setScanStep(0);
      let step = 0;
      scanRef.current = setInterval(() => {
        step++;
        if (step < SCAN_STEPS.length) setScanStep(step);
      }, 800);
    } else {
      if (scanRef.current) clearInterval(scanRef.current);
    }
    return () => { if (scanRef.current) clearInterval(scanRef.current); };
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResults([]);
    setSearched(false);
    setLoading(true);
    try {
      // ── Step 1: Fetch schemes (needed for both ML and fallback) ──
      const schemesRes = await fetch("/api/schemes");
      const db         = await schemesRes.json();
      const schemes: Scheme[] = db.schemes || [];

      // ── Step 2: Try ML search first ──
      let matched: MatchedScheme[] = [];
      let usedML = false;

      try {
        const mlRes = await fetch("/api/ml-search", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ 
            profile, 
            schemes,
            _t: Date.now()
          }),
        });

        const mlData = await mlRes.json();

        if (mlRes.ok && !mlData.fallback && mlData.results?.length >= 0) {
          matched = mlData.results;
          usedML  = true;
        } else {
          // ML index not built yet → fall through to rule-based
          throw new Error(mlData.error || "ML unavailable");
        }
      } catch {
        // ── Step 3: Graceful fallback to original rule-based engine ──
        matched = eligibilityEngine(profile, schemes);
        usedML  = false;
      }

      setResults(matched);
      setSearchMode(usedML ? "ml" : "rule");
      setSearched(true);

      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ 
          behavior: "smooth" 
        });
      }, 100);

    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  const filtered = filterCat === "All"
    ? results
    : results.filter((r) => r.scheme.category === filterCat);

  const high = results.filter((r) => r.confidence >= 75);
  const mid  = results.filter((r) => r.confidence >= 50 && r.confidence < 75);

  function addCompare(s: Scheme) {
    if (compareList.length >= 3 || compareList.some((c) => c.id === s.id)) return;
    const updated = [...compareList, s];
    setCompareList(updated);
    // Persist to localStorage so compare/page.tsx can read it
    try {
      localStorage.setItem("yojana_compare", JSON.stringify(updated));
    } catch {}
  }

  return (
    <>
      <Header />
      <main>
        <div className="page-wrap">
          <div className="section-title">
            🔍 Find Your Eligible Schemes
            <small>अपनी जानकारी भरें और योजनाएं खोजें</small>
          </div>

          <div className="box box-info">
            📋 Fill in your details. All fields help match the best schemes for you.
            Your information is used locally only — <strong>never stored or shared</strong>.
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="form-section-title">👤 Citizen Profile / नागरिक प्रोफ़ाइल</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>

                {/* Column 1 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">👤 Full Name / पूरा नाम</label>
                    <input className="form-input" placeholder="e.g. Ramesh Kumar"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">🎂 Age / उम्र *</label>
                    <input className="form-input" type="number" min={1} max={100}
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">⚧ Gender / लिंग *</label>
                    <select className="form-select"
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                {/* Column 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">📍 State / राज्य *</label>
                    <select className="form-select"
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}>
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">💼 Occupation / व्यवसाय *</label>
                    <select className="form-select"
                      value={profile.occupation}
                      onChange={(e) => setProfile({
                        ...profile,
                        occupation: e.target.value.split("/")[0].trim().toLowerCase(),
                      })}>
                      {OCCUPATIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">💰 Annual Income / सालाना आमदनी (₹) *</label>
                    <input className="form-input" type="number" min={0} step={10000}
                      value={profile.income}
                      onChange={(e) => setProfile({ ...profile, income: +e.target.value })} />
                  </div>
                </div>

                {/* Column 3 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">🏷️ Social Category / सामाजिक वर्ग *</label>
                    <select className="form-select"
                      value={profile.category}
                      onChange={(e) => setProfile({ ...profile, category: e.target.value })}>
                      {[
                        { value: "general",  label: "General" },
                        { value: "sc",       label: "SC — Scheduled Caste" },
                        { value: "st",       label: "ST — Scheduled Tribe" },
                        { value: "obc",      label: "OBC — Other Backward Class" },
                        { value: "minority", label: "Minority" },
                        { value: "ews",      label: "EWS — Economically Weaker Section" },
                      ].map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                    {[
                      { field: "bpl",      label: "BPL Card Holder / BPL कार्ड है" },
                      { field: "has_land", label: "Own agricultural land / कृषि भूमि है" },
                      { field: "disabled", label: "Person with Disability / विकलांग" },
                    ].map(({ field, label }) => (
                      <label key={field} className="form-checkbox">
                        <input type="checkbox"
                          checked={Boolean(profile[field as keyof CitizenProfile])}
                          onChange={(e) => setProfile({ ...profile, [field]: e.target.checked })} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <button type="submit" className="btn-primary"
                  disabled={loading}
                  style={{ width: "100%", fontSize: 15, padding: "13px 24px" }}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span className="spinner" />
                      {SCAN_STEPS[scanStep]}
                    </span>
                  ) : "🔍 Find My Schemes / मेरी योजनाएं खोजें"}
                </button>
              </div>
            </div>
          </form>

          {/* RESULTS */}
          {searched && (
            <div id="results-section">
              {/* Personalized Results Header */}
              <div style={{
                background: "linear-gradient(135deg, #002366 0%, #003a8c 100%)",
                color: "#fff",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                  🎯 Hi {profile.name || "there"},
                  <span style={{
                    float: "right", fontSize: 11, fontWeight: 600,
                    background: searchMode === "ml" ? "rgba(34,197,94,0.2)" : "rgba(255,152,0,0.2)",
                    color: searchMode === "ml" ? "#86efac" : "#fed7aa",
                    padding: "3px 10px", borderRadius: 99,
                  }}>
                    {searchMode === "ml" ? "🤖 ML Semantic" : "📋 Rule-based"}
                  </span>
                </div>
                <div style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.6 }}>
                  Based on your profile as a <strong>{profile.age}-year-old {profile.occupation}</strong>{" "}
                  from <strong>{profile.state}</strong>, our AI found{" "}
                  <span style={{ color: "#FF9800", fontWeight: 700, fontSize: 18 }}>{results.length}</span>{" "}
                  relevant schemes —{" "}
                  <span style={{ color: "#6ee7a0" }}>{high.length} high match</span>,{" "}
                  <span style={{ color: "#fbbf24" }}>{mid.length} medium match</span>.
                </div>
              </div>

              {searchMode === "rule" && (
                <div className="box box-warn">
                  ⚠️ ML index not built yet — using rule-based matching.
                  Run <code>npx ts-node scripts/build-ml-index.ts</code> to enable semantic search.
                </div>
              )}

              {mid.length > 0 && (
                <div className="box box-warn">
                  ⚠️ <strong>Possible Missed Benefits:</strong> You may also qualify for{" "}
                  {mid.length} more schemes (50–75% match).
                </div>
              )}

              {/* METRICS */}
              <div className="metrics-row">
                <div className="metric-card">
                  <div className="metric-num">{results.length}</div>
                  <div className="metric-lbl">Total Found</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num" style={{ color: "#138808" }}>{high.length}</div>
                  <div className="metric-lbl">High Match 75%+</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num" style={{ color: "#f59e0b" }}>{mid.length}</div>
                  <div className="metric-lbl">Medium Match</div>
                </div>
                <div className="metric-card">
                  <div className="metric-num">{results[0]?.confidence ?? 0}%</div>
                  <div className="metric-lbl">Best Score</div>
                </div>
              </div>

              <div style={{ textAlign: "right", marginBottom: 12 }}>
                <button
                  className="btn-outline btn-sm"
                  onClick={() => {
                    setResults([]);
                    setSearched(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  🔄 Change Profile & Search Again
                </button>
              </div>

              {/* FILTERS */}
              <div style={{ display: "flex", gap: 12, margin: "16px 0", flexWrap: "wrap", alignItems: "center" }}>
                <div className="form-group" style={{ flex: 2, minWidth: 140 }}>
                  <label className="form-label">Filter Category</label>
                  <select className="form-select" value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                  <label className="form-label">Show</label>
                  <select className="form-select" value={showN}
                    onChange={(e) => setShowN(+e.target.value)}>
                    {[5,10,15,20,50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {compareList.length > 0 && (
                  <div style={{
                    marginLeft: "auto", background: "#e8eaf6",
                    border: "1px solid #9fa8da", borderRadius: 8,
                    padding: "8px 14px", fontSize: 13, color: "#283593", fontWeight: 600,
                  }}>
                    ⚖️ Compare list: {compareList.length}/3
                  </div>
                )}
              </div>

              <div style={{ fontSize: 13, color: "#8898aa", marginBottom: 14 }}>
                Showing {Math.min(showN, filtered.length)} of {filtered.length} schemes
              </div>

              {filtered.slice(0, showN).map((r, i) => (
                <SchemeCard
                  key={r.scheme.id}
                  result={r}
                  index={i}
                  onAddCompare={addCompare}
                  compareCount={compareList.length}
                  inCompareList={compareList.some((c) => c.id === r.scheme.id)}
                />
              ))}

              {compareList.length > 0 && (
                <div style={{
                  position: "fixed", bottom: 24, right: 24, background: "#002366",
                  color: "#fff", borderRadius: 12, padding: "14px 22px",
                  boxShadow: "0 6px 24px rgba(0,35,102,0.4)", zIndex: 200,
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <span style={{ fontWeight: 700 }}>
                    ⚖️ {compareList.length} scheme{compareList.length > 1 ? "s" : ""} in compare
                  </span>
                  <a href="/compare" style={{
                    background: "#FF9800", color: "#fff", padding: "6px 14px",
                    borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: 13,
                  }}>
                    View Compare →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}