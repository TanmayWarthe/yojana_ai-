"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { searchSchemes } from "@/lib/eligibility";
import { CATEGORIES, CAT_META } from "@/lib/constants";
import type { Scheme } from "@/types";

function BrowseContent() {
  const searchParams  = useSearchParams();
  const initCat       = searchParams.get("category") || "All";

  const [schemes,  setSchemes]  = useState<Scheme[]>([]);
  const [query,    setQuery]    = useState("");
  const [category, setCategory] = useState(initCat);
  const [loading,  setLoading]  = useState(true);
  const [results,  setResults]  = useState<Scheme[]>([]);

  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/schemes")
      .then((r) => r.json())
      .then((db) => {
        const s = db.schemes || [];
        setSchemes(s);
        setResults(searchSchemes(s, "", initCat));
      })
      .finally(() => setLoading(false));
  }, [initCat]);

  function doSearch() {
    setResults(searchSchemes(schemes, query, category));
  }

  return (
    <>
      <Header />
      <main>
        <div className="page-wrap">
          <div className="section-title">
            📋 Browse All Schemes
            <small>सभी योजनाएं — Search, filter and explore {schemes.length} schemes</small>
          </div>

          {/* SEARCH BAR */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              className="form-input"
              style={{ flex: 3, minWidth: 200 }}
              placeholder="Search schemes... e.g. farmer, health, scholarship, MUDRA"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
            <select
              className="form-select"
              style={{ flex: 1.5, minWidth: 150 }}
              value={category}
              onChange={(e) => { setCategory(e.target.value); setResults(searchSchemes(schemes, query, e.target.value)); }}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-primary" onClick={doSearch} style={{ whiteSpace: "nowrap" }}>
              🔍 Search
            </button>
          </div>

          <div className="box box-info" style={{ padding: "10px 16px" }}>
            📊 Showing <strong>{results.length}</strong> schemes
            {category !== "All" && <> in <strong>{category}</strong></>}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ color: "#8898aa", marginTop: 12, fontSize: 14 }}>Loading schemes...</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {results.slice(0, 60).map((s, i) => {
                const cm = CAT_META[s.category] || CAT_META["General"];
                return (
                  <div key={s.id} className="scheme-card" style={{ marginBottom: 0, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <span className="cat-pill" style={{ background: cm.bg, color: cm.color, border: `1px solid ${cm.border}`, padding: "4px 10px", fontSize: 12 }}>
                        <span style={{ marginRight: 4 }}>{cm.icon}</span> {s.category}
                      </span>
                      <span style={{ fontSize: 12, color: "#8898aa", fontWeight: 700, background: "#f0f4fa", padding: "2px 8px", borderRadius: 12 }}>#{i + 1}</span>
                    </div>
                    
                    <div className="scheme-title" style={{ fontSize: 16, marginBottom: 4 }}>{s.name}</div>
                    <div className="scheme-ministry" style={{ marginBottom: 12, fontSize: 12, color: "#556080" }}>🏢 {s.ministry}</div>
                    
                    <p className="scheme-desc" style={{ flexGrow: 1, fontSize: 13, color: "#4a5568", lineHeight: 1.5 }}>
                      {s.description?.slice(0, 140)}{(s.description?.length || 0) > 140 ? "..." : ""}
                    </p>

                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed #e2eaf8" }}>
                      <button 
                        onClick={() => setSelectedLink(s.apply_link || "#")} 
                        className="apply-link" 
                        style={{ display: "block", textAlign: "center", width: "100%", padding: "10px", fontSize: 13, border: "none", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Check Details & Apply →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {results.length > 60 && (
            <div className="box box-info" style={{ marginTop: 12 }}>
              Showing first 60 of {results.length}. Use the search box to narrow down.
            </div>
          )}
        </div>

        {/* EXTERNAL LINK WARNING MODAL */}
        {selectedLink && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,35,102,0.6)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20
          }}>
            <div style={{
              background: "#fff", borderRadius: 12, padding: 24, maxWidth: 420, width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}>
              <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>⚠️</div>
              <h3 style={{ margin: "0 0 12px 0", color: "#002366", textAlign: "center", fontSize: 20 }}>
                You are leaving YojanaAI
              </h3>
              <p style={{ fontSize: 14, color: "#4a5568", lineHeight: 1.6, marginBottom: 24, textAlign: "center" }}>
                You are being redirected to an external government portal: <br/>
                <code style={{ background: "#f0f4fa", padding: "2px 6px", borderRadius: 4, display: "inline-block", marginTop: 8, wordBreak: "break-all" }}>
                  {selectedLink}
                </code>
                <br/><br/>
                <strong>Note:</strong> Some departmental websites may experience slow loading times or display browser security warnings (SSL errors) which are out of YojanaAI's control.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button className="btn-outline" onClick={() => setSelectedLink(null)} style={{ padding: "10px 20px" }}>
                  Cancel
                </button>
                <a 
                  href={selectedLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary" 
                  style={{ textDecoration: "none", padding: "10px 20px" }}
                  onClick={() => setSelectedLink(null)}
                >
                  Continue to Official Site
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ color: '#8898aa', fontSize: 14 }}>Loading...</div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
