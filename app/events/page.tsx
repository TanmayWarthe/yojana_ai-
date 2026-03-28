"use client";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SchemeCard from "@/components/schemes/SchemeCard";
import { lifeEventMatch } from "@/lib/eligibility";
import { LIFE_EVENTS } from "@/lib/constants";
import type { MatchedScheme } from "@/types";

export default function EventsPage() {
  const [results,      setResults]      = useState<MatchedScheme[]>([]);
  const [activeEvent,  setActiveEvent]  = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);

  async function handleEvent(event: string, keywords: string[]) {
    setActiveEvent(event);
    setLoading(true);
    try {
      const res = await fetch("/api/schemes");
      const db  = await res.json();
      const matched = lifeEventMatch(keywords, db.schemes || []);
      setResults(matched);
    } catch { setResults([]); }
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main>
        <div className="page-wrap">
          <div className="section-title">
            📅 Life Event Based Schemes
            <small>जीवन की घटना के अनुसार योजनाएं</small>
          </div>

          <div className="box box-info">
            📅 <strong>Select a recent life event</strong> to instantly discover all relevant government schemes.
            <br />अपने जीवन की कोई घटना चुनें — उससे जुड़ी सभी सरकारी योजनाएं तुरंत दिखेंगी।
          </div>

          <div className="life-events-grid" style={{ marginBottom: 24 }}>
            {Object.entries(LIFE_EVENTS).map(([event, keywords]) => (
              <button
                key={event}
                className={`life-event-btn${activeEvent === event ? " active" : ""}`}
                onClick={() => handleEvent(event, keywords)}
              >
                {event}
                {activeEvent === event && (
                  <span style={{ float: "right", color: "#FF9800", fontSize: 12 }}>Selected ✓</span>
                )}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: 32 }}>
              <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              <div style={{ color: "#8898aa", marginTop: 10, fontSize: 14 }}>Finding schemes...</div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="box box-ok">
                ✅ Found <strong>{results.length} schemes</strong> for: <strong>{activeEvent}</strong>
              </div>
              {results.map((r, i) => <SchemeCard key={r.scheme.id} result={r} index={i} />)}
            </>
          )}

          {!loading && activeEvent && results.length === 0 && (
            <div className="box box-warn">
              ⚠️ No schemes found for this life event. Try another event or use{" "}
              <a href="/find" style={{ color: "#002366", fontWeight: 700 }}>Find Schemes</a> for a more personalised search.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
