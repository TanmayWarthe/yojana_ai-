"use client";
import { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { eligibilityEngine } from "@/lib/eligibility";
import type { Scheme, CitizenProfile } from "@/types";

const COMPARE_KEY = "yojana_compare";

const ROWS: Array<{ label: string; icon: string; fn: (s: Scheme) => string }> = [
  { label: "Category",        icon: "🏷️", fn: (s) => s.category || "—" },
  { label: "Ministry",        icon: "🏢", fn: (s) => (s.ministry || "—").slice(0, 65) },
  { label: "State",           icon: "📍", fn: (s) => s.state || "Central" },
  { label: "Benefit 1",       icon: "✅", fn: (s) => (s.benefits?.[0] || "—").slice(0, 100) },
  { label: "Benefit 2",       icon: "✅", fn: (s) => (s.benefits?.[1] || "—").slice(0, 100) },
  { label: "Eligibility 1",   icon: "📋", fn: (s) => (s.eligibility_criteria?.[0] || "—").slice(0, 100) },
  { label: "Eligibility 2",   icon: "📋", fn: (s) => (s.eligibility_criteria?.[1] || "—").slice(0, 100) },
  { label: "Documents",       icon: "📎", fn: (s) => (s.documents_required || []).slice(0, 3).join(", ") || "—" },
];

export default function ComparePage() {
  const [list, setList] = useState<Scheme[]>([]);
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [verdict, setVerdict] = useState("");
  const [verdictLoading, setVerdictLoading] = useState(false);

  // Load compare list from localStorage + fetch all schemes for search + load profile
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
      setList(saved);
    } catch { setList([]); }

    fetch("/api/schemes")
      .then((r) => r.json())
      .then((d) => setAllSchemes(d.schemes || []))
      .catch(() => {});

    // Load user profile for confidence scoring
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
        }
      })
      .catch(() => {});
  }, []);

  function persist(updated: Scheme[]) {
    setList(updated);
    try { localStorage.setItem(COMPARE_KEY, JSON.stringify(updated)); } catch {}
  }

  // Compute confidence scores whenever list or profile changes
  useEffect(() => {
    if (!profile || list.length === 0) {
      setConfidence({});
      return;
    }

    const conf: Record<string, number> = {};
    const matches = eligibilityEngine(profile as CitizenProfile, list);
    matches.forEach((m) => {
      conf[m.scheme.id] = Math.min(100, Math.round((m.score || 0) * 100));
    });
    setConfidence(conf);
  }, [list, profile]);

  // Determine which scheme has the "best" value in each row
  function getBestSchemeId(fn: (s: Scheme) => string): string | null {
    if (list.length === 0) return null;
    const vals = list.map((s) => ({ id: s.id, val: fn(s) }));
    
    // Find the one with longest text (excluding "—")
    const validVals = vals.filter((v) => v.val !== "—");
    if (validVals.length === 0) return null;
    
    return validVals.reduce((best, curr) => {
      const bestLen = best.val.length;
      const currLen = curr.val.length;
      return currLen > bestLen ? curr : best;
    }).id;
  }

  function addScheme(s: Scheme) {
    if (list.length >= 3 || list.some((c) => c.id === s.id)) return;
    persist([...list, s]);
    setShowPicker(false);
    setSearchQuery("");
  }

  function remove(id: string) { persist(list.filter((s) => s.id !== id)); }
  function clear() { persist([]); }

  // Stream AI verdict for comparison
  async function handleGetVerdict() {
    if (list.length < 2) return;

    setVerdictLoading(true);
    setVerdict("");

    try {
      const schemes_text = list.map((s) => `${s.name}: ${(s.benefits || []).slice(0, 2).join(", ")}`).join("\n");
      const profile_text = profile 
        ? `${profile.name}, ${profile.age} yrs, ${profile.occupation}, ₹${profile.income}/yr, ${profile.state}`
        : "No profile saved";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Given this user profile: ${profile_text}\n\nAnd these schemes being compared:\n${schemes_text}\n\nProvide a brief (2-3 sentence) expert verdict on which scheme is BEST for this person and why. Be direct and actionable.`,
          }],
        }),
      });

      if (!res.body) {
        setVerdict("Failed to get response");
        setVerdictLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setVerdict(fullText);
      }
    } catch (err) {
      console.error(err);
      setVerdict("Error fetching verdict. Try again.");
    } finally {
      setVerdictLoading(false);
    }
  }

  // Filter search results (exclude already-selected)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allSchemes
      .filter((s) => !list.some((c) => c.id === s.id))
      .filter((s) => {
        const text = [s.name, s.category, s.ministry, ...(s.tags || [])].join(" ").toLowerCase();
        return text.includes(q);
      })
      .slice(0, 8);
  }, [searchQuery, allSchemes, list]);

  return (
    <>
      <Header />
      <main>
        <div className="page-wrap">
          <div className="section-title">
            ⚖️ Compare Schemes
            <small>तुलना करें — Side-by-side comparison of up to 3 schemes</small>
          </div>

          {/* ── SCHEME SELECTOR CARDS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
            {[0, 1, 2].map((idx) => {
              const s = list[idx];
              if (s) {
                return (
                  <div key={s.id} style={{
                    background: "#fff", border: "2px solid var(--navy)", borderRadius: 12,
                    padding: "16px 18px", position: "relative",
                  }}>
                    <button onClick={() => remove(s.id)} style={{
                      position: "absolute", top: 8, right: 8,
                      background: "#fee2e2", color: "#dc2626", border: "none",
                      borderRadius: "50%", width: 24, height: 24,
                      cursor: "pointer", fontWeight: 700, fontSize: 12, lineHeight: 1,
                    }}>✕</button>
                    <div style={{ fontSize: 11, color: "var(--orange)", fontWeight: 700, marginBottom: 4 }}>
                      SCHEME {idx + 1}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", lineHeight: 1.3 }}>
                      {s.name?.slice(0, 50)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      {s.ministry?.slice(0, 40)}
                    </div>
                  </div>
                );
              }
              return (
                <button key={idx} onClick={() => setShowPicker(true)} style={{
                  background: "#f8faff", border: "2px dashed var(--border-mid)",
                  borderRadius: 12, padding: "24px 18px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 6, transition: "all 0.2s",
                  color: "var(--text-muted)",
                }}>
                  <span style={{ fontSize: 28, opacity: 0.5 }}>+</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Add Scheme {idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* ── SEARCH PICKER MODAL ── */}
          {showPicker && (
            <div style={{
              background: "#fff", border: "1px solid var(--border)", borderRadius: 12,
              padding: "18px 20px", marginBottom: 20, boxShadow: "var(--shadow-lg)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>
                  🔍 Search & Add a Scheme
                </span>
                <button onClick={() => { setShowPicker(false); setSearchQuery(""); }} style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-muted)",
                }}>✕</button>
              </div>
              <input
                className="form-input"
                placeholder="Type scheme name, category, or keyword... (e.g. farmer, health, scholarship)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery.trim() && (
                <div style={{ marginTop: 10, maxHeight: 260, overflowY: "auto" }}>
                  {searchResults.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>
                      No schemes found for &ldquo;{searchQuery}&rdquo;. Try different keywords.
                    </div>
                  ) : (
                    searchResults.map((s) => (
                      <div key={s.id} onClick={() => addScheme(s)} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 12px", borderBottom: "1px solid #f0f4fa",
                        cursor: "pointer", borderRadius: 6, transition: "background 0.15s",
                      }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "#f0f5ff")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.category} · {s.ministry?.slice(0, 40)}</div>
                        </div>
                        <span style={{
                          background: "var(--navy)", color: "#fff", fontSize: 11,
                          fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                        }}>+ Add</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── COMPARISON TABLE ── */}
          {list.length >= 2 ? (
            <>
              {/* Confidence cards if profile exists */}
              {profile && Object.keys(confidence).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>
                    💡 ML Confidence Scores for Your Profile
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                    {list.map((s) => (
                      <div key={s.id} style={{
                        background: "linear-gradient(135deg, #f0f4ff, #f8faff)",
                        border: "1px solid #d0dce8",
                        borderRadius: 10,
                        padding: "14px 16px",
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 6 }}>
                          {s.name?.slice(0, 40)}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "#e8eef8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 18,
                            color: "#002366",
                          }}>
                            {confidence[s.id] || 0}%
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Match Score
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="box box-ok" style={{ marginBottom: 16 }}>
                ✅ Comparing <strong>{list.length} schemes</strong> side-by-side.
                Differences are highlighted for quick scanning.
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 140 }}>Field</th>
                      {list.map((s) => (
                        <th key={s.id}>{s.name?.slice(0, 40)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map(({ label, icon, fn }) => {
                      const vals = list.map(fn);
                      const allSame = vals.every((v) => v === vals[0]);
                      const bestId = getBestSchemeId(fn);
                      return (
                        <tr key={label}>
                          <td>{icon} {label}</td>
                          {list.map((s, i) => {
                            const isBest = bestId === s.id && vals[i] !== "—";
                            return (
                              <td key={s.id} style={{
                                background: !allSame && vals[i] !== "—" ? "#fffbec" : undefined,
                                fontWeight: !allSame ? 600 : 400,
                                position: "relative",
                              }}>
                                {isBest && (
                                  <span style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    background: "#fbbf24",
                                    color: "#78350f",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    fontSize: 10,
                                    fontWeight: 700,
                                  }}>
                                    🏆 Best
                                  </span>
                                )}
                                {vals[i]}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {/* Apply row */}
                    <tr>
                      <td>🔗 Apply</td>
                      {list.map((s) => (
                        <td key={s.id}>
                          <a
                            href={s.apply_link || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="apply-link"
                            style={{ fontSize: 11, padding: "6px 14px" }}
                          >
                            Apply Now →
                          </a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Verdict Section */}
              <div style={{ marginTop: 24 }}>
                <button
                  className="btn-primary"
                  onClick={handleGetVerdict}
                  disabled={verdictLoading}
                  style={{
                    width: "100%",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {verdictLoading ? (
                    <>
                      <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      Getting AI Verdict...
                    </>
                  ) : (
                    <>🤖 Get AI Expert Verdict</>
                  )}
                </button>

                {verdict && (
                  <div style={{
                    background: "#f0f4ff",
                    border: "2px solid #002366",
                    borderRadius: 12,
                    padding: "16px 20px",
                    marginTop: 12,
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#002366",
                      marginBottom: 8,
                    }}>
                      🤖 AI Expert Verdict
                    </div>
                    <div style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "#1e293b",
                    }}>
                      {verdict}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : list.length === 1 ? (
            <div className="box box-warn">
              ⚠️ Add <strong>at least 1 more scheme</strong> to see a side-by-side comparison.
              Click the <strong>+ Add Scheme</strong> cards above to search and add.
            </div>
          ) : (
            <div className="box box-info" style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>⚖️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>
                No Schemes Selected Yet
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
                Click any <strong>+ Add Scheme</strong> card above to search and add schemes,
                or go to <a href="/find" style={{ color: "var(--navy)", fontWeight: 700 }}>Find Schemes</a> and
                click the <strong>⚖️ Compare</strong> button on any scheme card.
              </div>
            </div>
          )}

          {list.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button className="btn-outline btn-sm" onClick={clear}>
                🗑️ Clear All & Start Over
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
