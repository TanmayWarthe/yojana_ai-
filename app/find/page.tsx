"use client";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SchemeCard from "@/components/schemes/SchemeCard";
import { eligibilityEngine } from "@/lib/eligibility";
import { STATES, OCCUPATIONS, CATEGORIES } from "@/lib/constants";
import type { CitizenProfile, MatchedScheme, Scheme } from "@/types";

const DEFAULT_PROFILE: CitizenProfile = {
  name: "",
  age: 0,
  gender: "",
  state: "",
  occupation: "",
  income: 0,
  category: "",
  bpl: false,
  has_land: false,
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
                    <label className="form-label">Full Name / पूरा नाम</label>
                    <input className="form-input" placeholder="e.g. Ramesh Kumar"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age / उम्र *</label>
                    <input className="form-input" type="number" min={1} max={100}
                      value={profile.age || ""}
                      onChange={(e) => setProfile({ ...profile, age: +e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender / लिंग *</label>
                    <select className="form-select"
                      value={profile.gender?.toLowerCase()}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                      <option value="">— Select —</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Column 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">State / राज्य *</label>
                    <select className="form-select"
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}>
                      <option value="">— Select State —</option>
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Occupation / व्यवसाय *</label>
                    <select className="form-select"
                      value={profile.occupation}
                      onChange={(e) => setProfile({
                        ...profile,
                        occupation: e.target.value,
                      })}>
                      <option value="">— Select Occupation —</option>
                      {OCCUPATIONS.map((o) => (
                        <option key={o} value={o.split("/")[0].trim().toLowerCase()}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Annual Income / सालाना आमदनी (₹) *</label>
                    <input className="form-input" type="number" min={0} step={10000}
                      value={profile.income || ""}
                      onChange={(e) => setProfile({ ...profile, income: +e.target.value })} />
                  </div>
                </div>

                {/* Column 3 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Social Category / सामाजिक वर्ग *</label>
                    <select className="form-select"
                      value={profile.category}
                      onChange={(e) => setProfile({ ...profile, category: e.target.value })}>
                      <option value="">— Select Category —</option>
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
                      Searching schemes... योजनाएं खोज रहे हैं...
                    </span>
                  ) : "🔍 Find My Schemes / मेरी योजनाएं खोजें"}
                </button>
              </div>
            </div>
          </form>

          {/* RESULTS */}
          {searched && (
            <div id="results-section">
              <div className="box box-ok">
                ✅ <strong>Found {results.length} schemes</strong> for{" "}
                <strong>{profile.name || "you"}</strong>
                {profile.state ? ` (${profile.state})` : ""} —{" "}
                <strong>{high.length} high match</strong>,{" "}
                <strong>{mid.length} medium match</strong>
                {/* Show which engine was used */}
                <span style={{
                  float: "right", fontSize: 11, fontWeight: 600,
                  background: searchMode === "ml" ? "#e8f5ee" : "#fff3e0",
                  color: searchMode === "ml" ? "#1a7a4a" : "#e65100",
                  padding: "2px 8px", borderRadius: 99,
                }}>
                  {searchMode === "ml" ? "🤖 ML Semantic" : "📋 Rule-based"}
                </span>
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
                  <div className="metric-num">{results.length > 0 ? (results[0]?.confidence ?? 0) : 0}%</div>
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
                  <label className="form-label" style={{marginBottom: 4}}>Filter Category</label>
                  <select className="form-select" value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}>
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                  <label className="form-label" style={{marginBottom: 4}}>Show</label>
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

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
              </div>

              {compareList.length > 0 && (
                <div style={{
                  position: "fixed", bottom: 24, right: 24, background: "#1a2340",
                  color: "#fff", borderRadius: 12, padding: "14px 22px",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.15)", zIndex: 200,
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <span style={{ fontWeight: 600 }}>
                    ⚖️ {compareList.length} scheme{compareList.length > 1 ? "s" : ""} in compare
                  </span>
                  <a href="/compare" style={{
                    background: "#ede9fe", color: "#4c1d95", padding: "6px 14px",
                    borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: 13,
                  }}>
                    View Compare →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
          main {
            background-color: #fafbfc;
            min-height: 100vh;
            font-family: inherit;
          }
          .page-wrap {
            max-width: 1300px;
            margin: 0 auto;
            padding: 40px 24px;
          }
          .section-title {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .section-title small {
            font-size: 13px;
            font-weight: 500;
            color: #64748b;
          }
          .box {
            padding: 14px 18px;
            border-radius: 8px;
            font-size: 13.5px;
            margin-bottom: 16px;
            line-height: 1.5;
          }
          .box-info { background: #f0f4ff; border: 1px solid #dbeafe; color: #1e40af; }
          .box-ok { background: #f0fdf4; border: 1px solid #dcfce7; color: #166534; }
          .box-warn { background: #fffbeb; border: 1px solid #fef08a; color: #92400e; }
          .form-section {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 28px 32px;
            margin-bottom: 32px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          }
          .form-section-title {
            font-size: 15px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          .form-label {
            display: block;
            font-size: 12.5px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 6px;
          }
          .form-input, .form-select {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
            background: #fff;
            color: #0f172a;
            box-sizing: border-box;
            appearance: none;
            -webkit-appearance: none;
          }
          .form-select {
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 14px center;
            background-size: 16px;
            padding-right: 40px;
          }
          .form-input:focus, .form-select:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          }
          .form-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
            color: #334155;
            cursor: pointer;
            user-select: none;
          }
          .form-checkbox input {
            width: 16px; height: 16px;
            accent-color: #3b82f6;
            cursor: pointer;
            margin: 0;
          }
          .btn-primary {
            background: #1a2340;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          .btn-primary:not(:disabled):hover { background: #2a3556; }
          .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-outline {
            background: #fff;
            border: 1px solid #cbd5e1;
            color: #475569;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-outline:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; }
          .btn-sm { padding: 8px 16px; font-size: 13px; }
          .metrics-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin: 24px 0;
          }
          .metric-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          }
          .metric-num { font-size: 26px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
          .metric-lbl { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .spinner {
            width: 16px; height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            display: inline-block;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          
          /* Scheme Cards grid adjustment */
          @media (max-width: 768px) {
            .metrics-row { grid-template-columns: repeat(2, 1fr); }
            .form-section > div[style] { grid-template-columns: 1fr !important; }
          }
        `}} />
      </main>
      <Footer />
    </>
  );
}