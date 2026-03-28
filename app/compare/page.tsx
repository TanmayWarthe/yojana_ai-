"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Scheme } from "@/types";

const COMPARE_KEY = "yojana_compare";

const ROWS: Array<{ label: string; fn: (s: Scheme) => string }> = [
  { label: "Scheme Name",     fn: (s) => s.name || "" },
  { label: "Category",        fn: (s) => s.category || "" },
  { label: "Ministry",        fn: (s) => (s.ministry || "").slice(0, 55) },
  { label: "State",           fn: (s) => s.state || "Central" },
  { label: "Top Benefit",     fn: (s) => (s.benefits?.[0] || "—").slice(0, 90) },
  { label: "Key Eligibility", fn: (s) => (s.eligibility_criteria?.[0] || "—").slice(0, 90) },
  { label: "Documents",       fn: (s) => (s.documents_required || []).slice(0, 3).join(", ") || "—" },
  { label: "Apply",           fn: (s) => s.apply_link || "#" },
];

export default function ComparePage() {
  const [list, setList] = useState<Scheme[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
      setList(saved);
    } catch { setList([]); }
  }, []);

  function remove(id: string) {
    const updated = list.filter((s) => s.id !== id);
    setList(updated);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(COMPARE_KEY, JSON.stringify(updated));
      }
    } catch {}
  }

  function clear() {
    setList([]);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(COMPARE_KEY);
      }
    } catch {}
  }

  return (
    <>
      <Header />
      <main>
        <div className="page-wrap">
          <div className="section-title">
            ⚖️ Compare Schemes
            <small>तुलना करें — Side-by-side comparison</small>
          </div>

          {list.length === 0 ? (
            <div className="box box-info">
              ℹ️ No schemes in your compare list yet.<br />
              Go to <a href="/find" style={{ color: "#002366", fontWeight: 700 }}>Find Schemes</a>,
              open any scheme and click <strong>⚖️ Compare</strong> to add it here.
              You can compare up to 3 schemes side-by-side.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "#6b7a99" }}>{list.length}/3 scheme{list.length > 1 ? "s" : ""} selected</span>
                <button className="btn-outline btn-sm" onClick={clear}>🗑️ Clear All</button>
                {list.map((s) => (
                  <button key={s.id} className="btn-outline btn-sm" onClick={() => remove(s.id)}
                    style={{ fontSize: 11 }}>
                    ✕ {s.name?.slice(0, 20)}
                  </button>
                ))}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 130 }}>Field</th>
                      {list.map((s) => (
                        <th key={s.id}>{s.name?.slice(0, 35)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map(({ label, fn }) => (
                      <tr key={label}>
                        <td>{label}</td>
                        {list.map((s) => {
                          const val = fn(s);
                          if (label === "Apply") {
                            return (
                              <td key={s.id}>
                                <a href={val} target="_blank" rel="noopener noreferrer" className="apply-link" style={{ fontSize: 11, padding: "6px 14px" }}>
                                  Apply →
                                </a>
                              </td>
                            );
                          }
                          return <td key={s.id}>{val}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {list.length < 3 && list.length > 0 && (
            <div className="box box-info" style={{ marginTop: 16 }}>
              💡 You can add {3 - list.length} more scheme{3 - list.length > 1 ? "s" : ""} to compare.
              Go to <a href="/find" style={{ color: "#002366", fontWeight: 700 }}>Find Schemes</a> to add more.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
