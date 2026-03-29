// PATCH for components/layout/Header.tsx
// Add this to NAV_LINKS array (after the existing links):
// { href: "/profile", label: "👤 My Profile" },
//
// And add the ProfileBadge component shown below.
// ─────────────────────────────────────────────────────────────────────────────
// Replace the full Header.tsx with this file.

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ensureUserId } from "@/lib/user-id";
import AuthModal from "@/components/auth/AuthModal";

const BASE_NAV_LINKS = [
  { href: "/",          label: "🏠 Home" },
  { href: "/find",      label: "🔍 Find Schemes" },
  { href: "/chat",      label: "💬 Ask AI" },
  { href: "/browse",    label: "📋 Browse All" },
  { href: "/events",    label: "📅 Life Events" },
  { href: "/compare",   label: "⚖️ Compare" },
  { href: "/doc-check", label: "📎 Doc Check" },
  // { href: "/about",     label: "ℹ️ About" },
];

interface HeaderProps {
  totalSchemes?: number;
  lastUpdated?: string;
}

interface ProfileSnap {
  name: string;
  occupation: string;
  state: string;
}

interface AuthUser {
  name: string;
  email: string;
}

export default function Header({ totalSchemes = 219, lastUpdated }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [profile,   setProfile]   = useState<ProfileSnap | null>(null);
  const [authUser,  setAuthUser]  = useState<AuthUser | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const navLinks = [
    ...BASE_NAV_LINKS,
  ];

  function applyProfile(p: { name?: string; occupation?: string; state?: string } | null) {
    if (p?.name) {
      setProfile({
        name: p.name,
        occupation: p.occupation || "",
        state: p.state || "",
      });
    } else {
      setProfile(null);
    }
  }

  // ── Load profile and auth identity ──────────────────────────────────────────────
  useEffect(() => {
    ensureUserId();
    
    // Attempt local cache load for snappy render
    try {
      const cachedProf = localStorage.getItem("yojana_profile_cache");
      if (cachedProf) applyProfile(JSON.parse(cachedProf));
      
      const cachedAuth = localStorage.getItem("yojana_auth_cache");
      if (cachedAuth) setAuthUser(JSON.parse(cachedAuth));
    } catch {}

    function fetchState() {
      // 1. Fetch Demographic Profile
      fetch("/api/profile")
        .then((r) => r.json())
        .then((d) => {
          applyProfile(d.profile || null);
          if (d.profile) localStorage.setItem("yojana_profile_cache", JSON.stringify(d.profile));
          else localStorage.removeItem("yojana_profile_cache");
        })
        .catch(() => {});
        
      // 2. Fetch Auth Identity
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          if (d.authenticated && d.user) {
            setAuthUser({ name: d.user.name, email: d.user.email });
            localStorage.setItem("yojana_auth_cache", JSON.stringify({ name: d.user.name, email: d.user.email }));
          } else {
            setAuthUser(null);
            localStorage.removeItem("yojana_auth_cache");
          }
        })
        .catch(() => {});
    }

    fetchState();

    const onStateUpdated = () => fetchState();
    window.addEventListener("yojana_profile_updated", onStateUpdated);
    
    return () => {
      window.removeEventListener("yojana_profile_updated", onStateUpdated);
    };
  }, [pathname]);

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

        {/* ── Profile Badge (top-right of header) ── */}
        {authUser ? (
          <div style={{ position: "relative" }} 
               onMouseEnter={() => setProfileMenuOpen(true)}
               onMouseLeave={() => setProfileMenuOpen(false)}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 10, padding: "8px 14px",
              cursor: "pointer", color: "#fff",
              transition: "background 0.2s",
              flexShrink: 0,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg, #FF9933, #138808)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, flexShrink: 0,
              }}>
                {authUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>
                  {authUser.name.split(" ")[0]}
                </div>
                {profile && profile.occupation && profile.state ? (
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                    {profile.occupation.split(" ")[0]} · {profile.state.split(" ")[0]}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                    {authUser.email.slice(0, 15)}...
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginLeft: 2 }}>▼</div>
            </div>

            {profileMenuOpen && (
              <div style={{
                position: "absolute", top: "100%", right: 0, marginTop: 8,
                background: "#ffffff", borderRadius: 8,
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)", minWidth: 160,
                zIndex: 9999, overflow: "hidden"
              }}>
                <Link href="/my-profile" style={{
                  display: "block", padding: "12px 16px", color: "#334155",
                  textDecoration: "none", fontSize: 14, fontWeight: 500,
                  borderBottom: "1px solid #f1f5f9"
                }}>
                  👤 Profile
                </Link>
                <button onClick={async () => {
                  setProfileMenuOpen(false);
                  await fetch("/api/auth/logout", { method: "POST" });
                  localStorage.removeItem("yojana_profile_cache");
                  localStorage.removeItem("yojana_auth_cache");
                  applyProfile(null);
                  setAuthUser(null);
                  window.dispatchEvent(new Event("yojana_profile_updated"));
                  window.location.href = "/";
                }} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 16px", color: "#ef4444", background: "none",
                  border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer"
                }}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setAuthModalOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#1e824c", // Green matching the screenshot
            border: "none",
            borderRadius: 6, padding: "8px 18px",
            color: "#fff", cursor: "pointer",
            fontSize: 16, fontWeight: 600, flexShrink: 0,
            transition: "opacity 0.2s"
          }}>
            Sign In →
          </button>
        )}
      </header>
      
      {authModalOpen && (
        <AuthModal 
          onClose={() => setAuthModalOpen(false)} 
          onSuccess={() => {
            setAuthModalOpen(false);
            window.dispatchEvent(new Event("yojana_profile_updated"));
          }} 
        />
      )}

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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }} className="desktop-nav-links">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link${pathname === l.href ? " active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              display: "none",
              background: "none",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 6, padding: "6px 10px",
              cursor: "pointer", color: "#fff",
              fontSize: 18, lineHeight: 1,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "#002366", borderTop: "1px solid rgba(255,255,255,0.15)",
            zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}>
            {navLinks.map((l) => (
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

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav-links { display: none !important; }
          .hamburger-btn { display: block !important; }
          .site-header { flex-direction: row; flex-wrap: wrap; gap: 10px; padding: 12px 16px !important; }
          .stats-bar { overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
          .stat-cell { min-width: 70px; flex: 0 0 auto; }
        }
        @media (max-width: 480px) {
          .site-header { justify-content: center; text-align: center; padding: 10px 12px !important; }
        }
      `}</style>
    </>
  );
}