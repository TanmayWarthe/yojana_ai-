"use client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { QUICK_ACCESS, CAT_META } from "@/lib/constants";
import type { SchemesDB } from "@/types";
import Link from "next/link";

export default function HomeClient({ db }: { db: SchemesDB }) {
  const { meta, schemes } = db;
  const recent = schemes.slice(-6);

  return (
    <>
      <Header totalSchemes={meta.total_schemes} lastUpdated={meta.last_updated} />
      <main>
        <div className="page-wrap">

          {/* WELCOME BANNER */}
          <div style={{
            background: "linear-gradient(135deg, #eef4ff 0%, #f8f0ff 100%)",
            border: "1px solid #c8d8f8", borderLeft: "5px solid #002366",
            borderRadius: 10, padding: "20px 24px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#002366", marginBottom: 6 }}>
              🏛️ YojanaAI में आपका स्वागत है — Welcome to YojanaAI!
            </div>
            <div style={{ fontSize: 14, color: "#4a5568", lineHeight: 1.75 }}>
              India&apos;s free AI-powered government scheme assistant. Talk in your language · Ask by voice · Discover schemes you&apos;re entitled to.
              <br />अपनी भाषा में बात करें &nbsp;·&nbsp; आवाज़ से पूछें &nbsp;·&nbsp; जानें कौन सी योजनाएं आपके लिए हैं।
            </div>
            <div style={{ fontSize: 12, color: "#8898aa", marginTop: 8 }}>
              🔒 Free service. We do not store your personal data. For official applications, visit the respective government portal.
            </div>
          </div>

          {/* CTA BUTTONS */}
          <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
            <Link href="/find" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
              🔍 Find My Schemes / मेरी योजनाएं खोजें
            </Link>
            <Link href="/chat" className="btn-outline" style={{ textDecoration: "none", display: "inline-block" }}>
              💬 Ask AI Assistant
            </Link>
          </div>

          {/* QUICK ACCESS */}
          <div className="section-title">
            ⚡ Quick Access
            <small>तुरंत जानकारी — Jump to what you need</small>
          </div>

          <div className="qa-grid">
            {QUICK_ACCESS.map((item) => (
              <Link key={item.cat} href={`/browse?category=${encodeURIComponent(item.cat)}`} style={{ textDecoration: "none" }}>
                <div className="qa-card">
                  <div className="qa-icon">{item.icon}</div>
                  <div className="qa-title">{item.title}</div>
                  <div className="qa-sub">{item.sub}</div>
                  <div className="qa-arrow">Explore →</div>
                </div>
              </Link>
            ))}
          </div>

          {/* STATS */}
          {meta.categories && Object.keys(meta.categories).length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 32 }}>
                📊 Scheme Database Coverage
                <small>Live data — refreshed every 6 hours from 100+ government sources</small>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                {Object.entries(meta.categories).map(([cat, count]) => {
                  const cm = CAT_META[cat] || CAT_META["General"];
                  return (
                    <Link key={cat} href={`/browse?category=${encodeURIComponent(cat)}`} style={{ textDecoration: "none" }}>
                      <div style={{
                        background: cm.bg, border: `1px solid ${cm.border}`,
                        borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                        transition: "transform 0.15s, box-shadow 0.15s",
                      }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                      >
                        <div style={{ fontSize: 22, marginBottom: 6 }}>{cm.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: cm.color, lineHeight: 1 }}>{count}</div>
                        <div style={{ fontSize: 11, color: cm.color, fontWeight: 600, marginTop: 3 }}>{cat}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* RECENT SCHEMES */}
          {recent.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 32 }}>
                📋 Recently Added Schemes
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {recent.map((s) => {
                  const cm = CAT_META[s.category] || CAT_META["General"];
                  return (
                    <div key={s.id} style={{
                      background: "#fff", border: "1px solid #dde4f0",
                      borderRadius: 10, padding: "12px 16px",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <span style={{ fontSize: 20 }}>{cm.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="browse-name-text">{s.name?.slice(0, 55)}</div>
                        <div className="browse-ministry-text">{s.ministry?.slice(0, 50)}</div>
                      </div>
                      <span className="cat-pill" style={{ background: cm.bg, color: cm.color, border: `1px solid ${cm.border}`, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5 }}>
                        {s.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* DISCLAIMER */}
          <div className="box box-warn" style={{ marginTop: 28 }}>
            ⚠️ <strong>Important / महत्वपूर्ण:</strong> YojanaAI provides scheme information for awareness only.
            Always visit the official government portal or nearest <strong>CSC (Common Service Centre / Jan Seva Kendra)</strong> for actual applications.
            This is NOT an official government website.
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
