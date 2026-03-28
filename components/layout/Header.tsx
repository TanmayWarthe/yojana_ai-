"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/",          label: "🏠 Home" },
  { href: "/find",      label: "🔍 Find Schemes" },
  { href: "/chat",      label: "💬 Ask AI" },
  { href: "/browse",    label: "📋 Browse All" },
  { href: "/events",    label: "📅 Life Events" },
  { href: "/compare",   label: "⚖️ Compare" },
  { href: "/doc-check", label: "📎 Doc Check" },
  { href: "/about",     label: "ℹ️ About" },
];

interface HeaderProps {
  totalSchemes?: number;
  lastUpdated?: string;
}

export default function Header({ totalSchemes = 219, lastUpdated }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const updated = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");

  return (
    <>
      <div className="tricolor" />

      <header className="site-header">
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div className="header-emblem">🏛️</div>
          <div>
            <div className="header-name">YojanaAI</div>
            <div className="header-tagline">
              आपकी योजना, आपकी आवाज़ — Your Scheme, Your Voice
            </div>
            <div className="header-sub">
              AI-Powered Government Scheme Assistant &nbsp;|&nbsp;
              Team Exception &nbsp;|&nbsp; Pallotti Hackfest PS-3
            </div>
          </div>
        </div>
  
      </header>

      <div className="stats-bar">
        {[
          { num: String(totalSchemes || "219+"), lbl: "Schemes" },
          { num: "9",    lbl: "Languages" },
          { num: "13",   lbl: "Categories" },
          { num: "100+", lbl: "Govt Sources" },
          { num: "6 Hr", lbl: "Data Refresh" },
          { num: "Free", lbl: "For Citizens" },
        ].map((s) => (
          <div key={s.lbl} className="stat-cell">
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Desktop nav */}
      <nav className="site-nav" style={{ position: "relative" }}>
        <div className="nav-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Desktop links — hidden on mobile */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }} className="desktop-nav-links">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link${pathname === l.href ? " active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Hamburger button — visible only on mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              display: "none",
              background: "none",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
              color: "#fff",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#002366",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link${pathname === l.href ? " active" : ""}`}
                style={{ display: "block", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Responsive styles injected inline */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav-links { display: none !important; }
          .hamburger-btn { display: block !important; }
          .site-header { flex-direction: column; gap: 12px; text-align: center; padding: 16px; }
          .stats-bar { overflow-x: auto; flex-wrap: nowrap; }
          .stat-cell { min-width: 70px; }
        }
      `}</style>
    </>
  );
}
