"use client";
import { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { eligibilityEngine } from "@/lib/eligibility";
import { STATES, OCCUPATIONS, CAT_META } from "@/lib/constants";
import type { CitizenProfile, MatchedScheme, Scheme } from "@/types";

const CATEGORIES_FILTER = [
  "All","Agriculture","Health","Education","Housing",
  "Women & Child","Business & Finance","Employment",
  "Social Welfare","Insurance","Food Security","Digital & Tech",
];

const CATEGORY_SHORT: Record<string,string> = {
  "General / Unreserved":"General","SC — Scheduled Caste":"SC",
  "ST — Scheduled Tribe":"ST","OBC — Other Backward Class (Central List)":"OBC",
  "OBC — Other Backward Class (State List)":"OBC",
  "EWS — Economically Weaker Section":"EWS",
  "DNT — De-notified / Nomadic Tribe":"ST",
  "Minority — Muslim":"minority","Minority — Christian":"minority",
  "Minority — Sikh":"minority","Minority — Buddhist":"minority",
  "Minority — Parsi":"minority","Minority — Jain":"minority",
};

const EMPTY: CitizenProfile = {
  name:"",age:30,gender:"Male",state:"",occupation:"",
  income:0,category:"General",bpl:false,has_land:false,disabled:false,
};

type SortMode = "best_match" | "verified_first" | "state_first" | "income_schemes";

export default function FindPage() {
  const [profile,       setProfile]       = useState<CitizenProfile>(EMPTY);
  const [allResults,    setAllResults]    = useState<MatchedScheme[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [searched,      setSearched]      = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [catFilter,     setCatFilter]     = useState("All");
  const [sortMode,      setSortMode]      = useState<SortMode>("best_match");
  const [expanded,      setExpanded]      = useState<Set<string>>(new Set());

  // ── Auto-load profile ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      if (d.profile) {
        const p = d.profile;
        const det = p.details ? JSON.parse(p.details) : {};
        setProfile({
          name:       p.name       || "",
          age:        p.age        || 30,
          gender:     p.gender     || "Male",
          state:      p.state      || "",
          occupation: p.occupation || "",
          income:     p.income     || 0,
          category:   p.category   || "General",
          bpl:        p.bpl        || false,
          has_land:   p.has_land   || false,
          disabled:   p.disabled   || false,
        });
        setProfileLoaded(true);
      }
    }).catch(() => {});
  }, []);

  function setP(k: keyof CitizenProfile, v: unknown) {
    setProfile(p => ({ ...p, [k]: v }));
  }

  // ── Find schemes ───────────────────────────────────────────────────────────
  async function handleFind() {
    if (!profile.state || !profile.occupation) return;
    setLoading(true); setSearched(true); setCatFilter("All");
    try {
      // Try ML search first
      try {
        const mlRes = await fetch("/api/ml-search", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "", profile }),
        });
        if (mlRes.ok) {
          const d = await mlRes.json();
          setAllResults(d.results || []);
          setLoading(false); return;
        }
      } catch { /* fallback */ }
      // Rule-based fallback
      const res = await fetch("/api/schemes");
      const db  = await res.json();
      setAllResults(eligibilityEngine(profile, db.schemes || []));
    } catch { setAllResults([]); }
    setLoading(false);
  }

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...allResults];
    if (catFilter !== "All") list = list.filter(r => r.scheme.category === catFilter);
    if (sortMode === "verified_first")
      list.sort((a,b) => (b.scheme.data_quality === "verified" ? 1 : 0) - (a.scheme.data_quality === "verified" ? 1 : 0) || b.score - a.score);
    else if (sortMode === "state_first")
      list.sort((a,b) => {
        const aS = a.scheme.state === profile.state ? 1 : 0;
        const bS = b.scheme.state === profile.state ? 1 : 0;
        return bS - aS || b.score - a.score;
      });
    else if (sortMode === "income_schemes")
      list.sort((a,b) => {
        const aI = JSON.stringify(a.scheme.eligibility_tags).includes("income") ? 1 : 0;
        const bI = JSON.stringify(b.scheme.eligibility_tags).includes("income") ? 1 : 0;
        return bI - aI || b.score - a.score;
      });
    else list.sort((a,b) => b.score - a.score);
    return list;
  }, [allResults, catFilter, sortMode, profile.state]);

  // ── Category breakdown ─────────────────────────────────────────────────────
  const catBreakdown = useMemo(() => {
    const counts: Record<string,number> = {};
    allResults.forEach(r => {
      const c = r.scheme.category || "General";
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [allResults]);

  function toggleExpand(id: string) {
    setExpanded(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <>
      <Header />
      <main style={{ background: "#f0f4f8", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1540, width: "100%", margin: "0 auto", padding: "10px 8px 30px" }}>

          {/* Page title */}
          <div style={{ background:"#002366", color:"#fff", borderRadius:"8px 8px 0 0",
            padding:"16px 22px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:2, opacity:0.65, textTransform:"uppercase", marginBottom:2 }}>
                YojanaAI · Personalised Scheme Finder
              </div>
              <div style={{ fontSize:17, fontWeight:800 }}>🔍 Find Government Schemes</div>
            </div>
            {profileLoaded && (
              <div style={{ fontSize:12, opacity:0.85, textAlign:"right" }}>
                <div style={{ fontWeight:700 }}>👤 {profile.name || "Your Profile"}</div>
                <a href="/profile" style={{ color:"#fbbf24", fontSize:11, textDecoration:"none" }}>✎ Edit Profile</a>
              </div>
            )}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:0,
            border:"1px solid #d0d9e8", borderTop:"none", borderRadius:"0 0 8px 8px",
            background:"#fff", overflow:"hidden" }}>

            {/* ── LEFT: Form ── */}
            <div style={{ borderRight:"1px solid #eef0f8", background:"#fafbff" }}>

              {profileLoaded && (
                <div style={{ background:"#edfbf3", borderBottom:"1px solid #b8dfc8",
                  padding:"8px 14px", fontSize:12, color:"#155d2b", display:"flex",
                  justifyContent:"space-between", alignItems:"center" }}>
                  <span>✅ Profile auto-loaded</span>
                  <a href="/profile" style={{ color:"#002366", fontWeight:700, fontSize:11, textDecoration:"none" }}>Edit</a>
                </div>
              )}
              {!profileLoaded && (
                <div style={{ background:"#fff8e6", borderBottom:"1px solid #f0d080",
                  padding:"8px 14px", fontSize:12, color:"#92400e" }}>
                  💡 <a href="/profile" style={{ color:"#002366", fontWeight:700 }}>Save profile</a> to auto-fill
                </div>
              )}

              <div style={{ padding:"12px" }}>

                {/* Personal */}
                <div style={{ fontSize:11, fontWeight:700, color:"#6b7a99", letterSpacing:1,
                  textTransform:"uppercase", marginBottom:8, paddingBottom:6,
                  borderBottom:"1px solid #eef0f8" }}>Personal</div>

                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>
                    Full Name
                  </label>
                  <input className="fi" placeholder="Your name"
                    value={profile.name} onChange={e => setP("name", e.target.value)} />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>Age</label>
                    <input className="fi" type="number" min={1} max={120} placeholder="35"
                      value={profile.age} onChange={e => setP("age", Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>Gender</label>
                    <select className="fi" value={profile.gender} onChange={e => setP("gender", e.target.value)}>
                      {["Male","Female","Other"].map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>
                    State / UT <span style={{ color:"#dc2626" }}>*</span>
                  </label>
                  <select className="fi" value={profile.state} onChange={e => setP("state", e.target.value)}>
                    <option value="">— Select State —</option>
                    {STATES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Economic */}
                <div style={{ fontSize:11, fontWeight:700, color:"#6b7a99", letterSpacing:1,
                  textTransform:"uppercase", margin:"14px 0 8px", paddingBottom:6,
                  borderBottom:"1px solid #eef0f8" }}>Economic</div>

                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>
                    Occupation <span style={{ color:"#dc2626" }}>*</span>
                  </label>
                  <select className="fi" value={profile.occupation} onChange={e => setP("occupation", e.target.value)}>
                    <option value="">— Select occupation —</option>
                    {OCCUPATIONS.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>
                      Category
                    </label>
                    <select className="fi" value={profile.category}
                      onChange={e => setP("category", CATEGORY_SHORT[e.target.value] || e.target.value)}>
                      {["General","SC","ST","OBC","EWS","Minority"].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>
                      Annual Income (₹)
                    </label>
                    <input className="fi" type="number" min={0} placeholder="96000"
                      value={profile.income} onChange={e => setP("income", Number(e.target.value))} />
                  </div>
                </div>

                {/* Attributes */}
                <div style={{ fontSize:11, fontWeight:700, color:"#6b7a99", letterSpacing:1,
                  textTransform:"uppercase", margin:"14px 0 8px", paddingBottom:6,
                  borderBottom:"1px solid #eef0f8" }}>Attributes</div>

                {[
                  { k:"bpl"      as const, label:"BPL / AAY Card Holder" },
                  { k:"has_land" as const, label:"Agricultural Land Owner" },
                  { k:"disabled" as const, label:"Person with Disability" },
                ].map(({ k, label }) => (
                  <div key={k} onClick={() => setP(k, !profile[k])} style={{
                    display:"flex", alignItems:"center", gap:8, marginBottom:6,
                    padding:"7px 10px", border:`1px solid ${profile[k]?"#002366":"#d0d9e8"}`,
                    background: profile[k]?"#f0f4ff":"#fff", borderRadius:5,
                    cursor:"pointer", transition:"all 0.15s",
                  }}>
                    <div style={{ width:16, height:16, borderRadius:3, flexShrink:0,
                      border:`2px solid ${profile[k]?"#002366":"#aab4c8"}`,
                      background: profile[k]?"#002366":"#fff",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {profile[k] && <span style={{ color:"#fff", fontSize:10, fontWeight:700, lineHeight:1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:12, fontWeight:600, color: profile[k]?"#002366":"#4a5568" }}>{label}</span>
                  </div>
                ))}

                <button onClick={handleFind}
                  disabled={loading || !profile.state || !profile.occupation}
                  style={{
                    width:"100%", marginTop:14, padding:"11px 0",
                    background: (!profile.state||!profile.occupation) ? "#c8d0de" : "#002366",
                    color:"#fff", border:"none", borderRadius:5,
                    fontSize:13, fontWeight:700, cursor: (!profile.state||!profile.occupation) ? "not-allowed" : "pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  }}>
                  {loading
                    ? <><span style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",
                        borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",
                        animation:"spin 0.7s linear infinite" }}/> Finding...</>
                    : "🎯 Find My Schemes"
                  }
                </button>
                {(!profile.state || !profile.occupation) && (
                  <div style={{ fontSize:11, color:"#dc2626", marginTop:6, textAlign:"center" }}>
                    State and Occupation are required
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Results ── */}
            <div style={{ minHeight:500, background:"#fff" }}>

              {/* Empty / pre-search state */}
              {!searched && !loading && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", height:"100%", padding:"24px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:52, marginBottom:16 }}>🎯</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#002366", marginBottom:8 }}>
                    {profileLoaded ? `Welcome back, ${profile.name.split(" ")[0] || "Citizen"}!` : "Ready to find your schemes"}
                  </div>
                  <div style={{ fontSize:13, color:"#8898aa", maxWidth:300, lineHeight:1.7 }}>
                    {profileLoaded
                      ? "Your profile is loaded. Click Find My Schemes to get personalised results."
                      : "Fill in the form on the left and click Find My Schemes."}
                  </div>
                  {!profileLoaded && (
                    <a href="/profile" style={{ marginTop:16, background:"#002366", color:"#fff",
                      borderRadius:6, padding:"9px 20px", fontSize:13, fontWeight:700, textDecoration:"none" }}>
                      👤 Complete Full Profile →
                    </a>
                  )}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", height:260, gap:12 }}>
                  <div style={{ width:36,height:36,border:"3px solid #002366",
                    borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
                  <div style={{ fontSize:13, color:"#8898aa" }}>Running eligibility engine...</div>
                </div>
              )}

              {/* Results */}
              {!loading && searched && allResults.length > 0 && (
                <div>
                  {/* Results header bar */}
                  <div style={{ padding:"10px 16px", borderBottom:"1px solid #eef0f8",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexWrap:"wrap", gap:8, background:"#fafbff" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#002366" }}>
                      {displayed.length} schemes
                      {catFilter !== "All" && <span style={{ color:"#FF9933" }}> · {catFilter}</span>}
                      <span style={{ fontSize:11, color:"#8898aa", fontWeight:400, marginLeft:8 }}>
                        of {allResults.length} total
                      </span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:"#8898aa" }}>Sort:</span>
                      <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}
                        style={{ fontSize:11, padding:"4px 8px", border:"1px solid #d0d9e8",
                          borderRadius:4, color:"#374567", background:"#fff", cursor:"pointer" }}>
                        <option value="best_match">Best Match</option>
                        <option value="verified_first">Verified First</option>
                        <option value="state_first">State Schemes First</option>
                        <option value="income_schemes">Income-based First</option>
                      </select>
                    </div>
                  </div>

                  {/* Category filter chips */}
                  <div style={{ padding:"10px 14px", display:"flex", gap:6, flexWrap:"wrap",
                    borderBottom:"1px solid #eef0f8", background:"#fff" }}>
                    {CATEGORIES_FILTER.filter(c => c === "All" || catBreakdown[c]).map(c => {
                      const cm = CAT_META[c] || { icon:"📋", color:"#374567", bg:"#f0f4ff", border:"#c8d0e0" };
                      const cnt = c === "All" ? allResults.length : catBreakdown[c] || 0;
                      const active = catFilter === c;
                      return (
                        <button key={c} onClick={() => setCatFilter(c)} style={{
                          display:"flex", alignItems:"center", gap:4,
                          padding:"4px 10px", borderRadius:99, fontSize:11, fontWeight:600,
                          cursor:"pointer", transition:"all 0.15s",
                          background: active ? "#002366" : cm.bg,
                          color: active ? "#fff" : cm.color,
                          border: `1px solid ${active?"#002366":cm.border}`,
                        }}>
                          {c !== "All" && cm.icon} {c}
                          <span style={{ background: active?"rgba(255,255,255,0.25)":"rgba(0,0,0,0.08)",
                            borderRadius:99, padding:"1px 6px", fontSize:10 }}>{cnt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Scheme cards */}
                  <div style={{ padding:"0" }}>
                    {displayed.slice(0, 40).map((r, i) => (
                      <SchemeRow key={r.scheme.id} r={r} index={i}
                        isOpen={expanded.has(r.scheme.id)}
                        onToggle={() => toggleExpand(r.scheme.id)}
                        profileState={profile.state} />
                    ))}
                    {displayed.length === 0 && (
                      <div style={{ padding:32, textAlign:"center", color:"#8898aa", fontSize:13 }}>
                        No schemes in this category. Try another filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!loading && searched && allResults.length === 0 && (
                <div style={{ padding:"24px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>😔</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#002366", marginBottom:8 }}>
                    No matching schemes found
                  </div>
                  <div style={{ fontSize:13, color:"#8898aa" }}>
                    Try changing your state or occupation, or{" "}
                    <a href="/browse" style={{ color:"#002366", fontWeight:700 }}>browse all schemes</a>.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`
        .fi{width:100%;padding:7px 9px;border:1.5px solid #c8d0de;border-radius:4px;
          font-size:12px;color:#1a2340;background:#fff;outline:none;font-family:inherit;box-sizing:border-box;}
        .fi:focus{border-color:#002366;box-shadow:0 0 0 2px rgba(0,35,102,0.08);}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:980px){
          div[style*="grid-template-columns:360px 1fr"]{grid-template-columns:1fr!important;}
        }
      `}</style>
    </>
  );
}

// ── Scheme Row Card ────────────────────────────────────────────────────────────
function SchemeRow({ r, index, isOpen, onToggle, profileState }: {
  r: MatchedScheme; index: number; isOpen: boolean;
  onToggle: () => void; profileState: string;
}) {
  const s = r.scheme;
  const cm = CAT_META[s.category] || CAT_META["General"];
  const conf = r.confidence;
  const confColor = conf >= 75 ? "#138808" : conf >= 50 ? "#d97706" : "#94a3b8";
  const isStateMatch = s.state !== "Central" && s.state === profileState;
  const isVerified   = s.data_quality === "verified";

  const applyUrl = s.apply_link && !s.apply_link.includes("wikipedia")
    ? s.apply_link
    : `https://www.myscheme.gov.in/search?q=${encodeURIComponent(s.name.slice(0,60))}`;

  return (
    <div style={{
      borderBottom:"1px solid #eef0f8",
      background: isOpen ? "#fafbff" : "#fff",
      transition:"background 0.15s",
    }}>
      {/* Row header — always visible */}
      <div style={{ display:"flex", alignItems:"center", gap:0, cursor:"pointer" }}
        onClick={onToggle}>

        {/* Rank */}
        <div style={{ width:36, textAlign:"center", fontSize:11, fontWeight:700,
          color:"#aab4c8", flexShrink:0, padding:"14px 0" }}>
          {index+1}
        </div>

        {/* Confidence bar (vertical) */}
        <div style={{ width:4, alignSelf:"stretch", background:"#f0f4f8", flexShrink:0, position:"relative" }}>
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            height:`${conf}%`, background:confColor,
            transition:"height 0.3s",
          }}/>
        </div>

        {/* Main content */}
        <div style={{ flex:1, padding:"12px 14px", minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:5 }}>
            <div style={{ flex:1, minWidth:0 }}>
              {/* Badges row */}
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:4 }}>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99,
                  background:cm.bg, color:cm.color, border:`1px solid ${cm.border}` }}>
                  {cm.icon} {s.category}
                </span>
                {s.state === "Central"
                  ? <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99,
                      background:"#f0f4ff", color:"#374567", border:"1px solid #c8d4f0" }}>🇮🇳 Central</span>
                  : <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99,
                      background: isStateMatch?"#edfbf3":"#f8f9ff",
                      color: isStateMatch?"#138808":"#556080",
                      border:`1px solid ${isStateMatch?"#a8d5b8":"#d0d9e8"}` }}>
                      📍 {s.state}
                    </span>
                }
                {isVerified && <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99,
                  background:"#edfbf3", color:"#155d2b", border:"1px solid #a8d5b8" }}>✓ Verified</span>}
              </div>
              {/* Scheme name */}
              <div style={{ fontSize:14, fontWeight:700, color:"#002366", lineHeight:1.3,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {s.name}
              </div>
              <div style={{ fontSize:11, color:"#8898aa", marginTop:2 }}>🏢 {s.ministry}</div>
            </div>

            {/* Confidence badge */}
            <div style={{ textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:16, fontWeight:800, color:confColor, lineHeight:1 }}>{conf}%</div>
              <div style={{ fontSize:9, color:"#aab4c8", marginTop:1 }}>match</div>
            </div>
          </div>

          {/* Reasons pills */}
          {r.reasons.length > 0 && (
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {r.reasons.slice(0,3).map((reason,i) => (
                <span key={i} style={{ fontSize:10, padding:"2px 8px", borderRadius:99,
                  background:"#f0f8ff", color:"#1565c0", border:"1px solid #bee3f8" }}>
                  ✓ {reason}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <div style={{ padding:"14px 14px", flexShrink:0, color:"#aab4c8", fontSize:12 }}>
          <span style={{ display:"inline-block", transition:"transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
        </div>
      </div>

      {/* Expanded detail panel */}
      {isOpen && (
        <div style={{ borderTop:"1px solid #eef0f8", padding:"16px 20px 16px 54px",
          background:"#fafbff" }}>

          {/* Description */}
          {s.description && (
            <p style={{ fontSize:13, color:"#4a5568", lineHeight:1.7, marginBottom:14,
              padding:"10px 14px", background:"#fff", border:"1px solid #eef0f8",
              borderLeft:"3px solid #002366", borderRadius:"0 6px 6px 0" }}>
              {s.description.slice(0,300)}{s.description.length>300?"...":""}
            </p>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:14 }}>
            {/* Benefits */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#002366", marginBottom:6,
                textTransform:"uppercase", letterSpacing:0.5 }}>✅ Benefits</div>
              {(s.benefits||[]).slice(0,4).map((b,i)=>(
                <div key={i} style={{ fontSize:12, color:"#374567", padding:"3px 0",
                  borderBottom:"1px solid #f4f6fa", lineHeight:1.5 }}>• {b}</div>
              ))}
            </div>
            {/* Eligibility */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#002366", marginBottom:6,
                textTransform:"uppercase", letterSpacing:0.5 }}>📋 Eligibility</div>
              {(s.eligibility_criteria||[]).slice(0,4).map((e,i)=>(
                <div key={i} style={{ fontSize:12, color:"#374567", padding:"3px 0",
                  borderBottom:"1px solid #f4f6fa", lineHeight:1.5 }}>• {e}</div>
              ))}
            </div>
            {/* Documents */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#002366", marginBottom:6,
                textTransform:"uppercase", letterSpacing:0.5 }}>📎 Documents</div>
              {(s.documents_required||[]).slice(0,5).map((d,i)=>(
                <div key={i} style={{ fontSize:12, color:"#374567", padding:"3px 0",
                  borderBottom:"1px solid #f4f6fa", lineHeight:1.5 }}>• {d}</div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <a href={applyUrl} target="_blank" rel="noopener noreferrer" style={{
              background:"#002366", color:"#fff", borderRadius:5,
              padding:"8px 18px", fontSize:12, fontWeight:700, textDecoration:"none",
            }}>
              🔗 Apply / आवेदन करें
            </a>
            <a href={`/chat?scheme=${encodeURIComponent(s.name)}`} style={{
              background:"#fff", color:"#002366", border:"1.5px solid #002366",
              borderRadius:5, padding:"8px 14px", fontSize:12, fontWeight:600, textDecoration:"none",
            }}>
              💬 Ask AI about this
            </a>
            <button onClick={() => {
              const msg=`🏛️ *${s.name}*\n\n✅ ${s.benefits?.[0]||"Govt scheme"}\n\n📎 Documents: ${(s.documents_required||[]).slice(0,3).join(", ")}\n\n🔗 Apply: ${applyUrl}\n\n_YojanaAI — आपकी योजना, आपकी आवाज़_`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");
            }} style={{
              background:"#25D366", color:"#fff", border:"none", borderRadius:5,
              padding:"8px 14px", fontSize:12, fontWeight:600, cursor:"pointer",
            }}>
              📲 WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}