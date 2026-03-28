"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type SavedProfile = {
  name: string;
  age: number;
  gender: string;
  state: string;
  occupation: string;
  income: number;
  category: string;
  bpl: boolean;
  has_land: boolean;
  disabled: boolean;
  details?: string | Record<string, unknown>;
};

function parseDetails(details: SavedProfile["details"]) {
  if (!details) return {} as Record<string, unknown>;
  if (typeof details === "string") {
    try {
      return JSON.parse(details) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return details;
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile || null);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const details = useMemo(() => parseDetails(profile?.details), [profile]);

  if (loading) {
    return (
      <>
        <Header />
        <main>
          <div className="page-wrap" style={{ textAlign: "center", paddingTop: 48 }}>
            <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <div style={{ fontSize: 13, color: "#8898aa", marginTop: 10 }}>Loading your profile...</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main>
          <div className="page-wrap" style={{ maxWidth: 1320, width: "100%", padding: "8px 8px 8px" }}>
            <div className="section-title">👤 My Profile</div>
            <div className="box box-info">
              No saved profile found. Fill your details first in the profile form.
            </div>
            <a href="/profile" className="btn-primary" style={{ textDecoration: "none" }}>
              📝 Go to Profile Form
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const rows: Array<[string, string]> = [
    ["Full Name", profile.name || "—"],
    ["Age", profile.age ? `${profile.age} years` : "—"],
    ["Gender", profile.gender || "—"],
    ["State", profile.state || "—"],
    ["Occupation", profile.occupation || "—"],
    ["Annual Income", `₹${Number(profile.income || 0).toLocaleString("en-IN")}`],
    ["Category", profile.category || "—"],
    ["BPL", profile.bpl ? "Yes" : "No"],
    ["Has Land", profile.has_land ? "Yes" : "No"],
    ["Disability", profile.disabled ? "Yes" : "No"],
    ["District", String(details.district || "—")],
    ["Education", String(details.education || "—")],
    ["Ration Card", String(details.ration_card || "—")],
    ["Mobile", String(details.mobile || "—")],
  ];

  return (
    <>
      <Header />
      <main>
        <div className="page-wrap" style={{ maxWidth: 1540, width: "100%", padding: "8px 8px 8px" }}>
          <div className="section-title">
            👤 My Profile
            <small>Saved details used across scheme matching, compare and chat</small>
          </div>

          <div className="box box-ok" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>✅ Profile is active and tracked across the site.</span>
            <a href="/profile" className="btn-outline btn-sm" style={{ textDecoration: "none" }}>
              📝 Switch to Edit Form
            </a>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #dbe2ef",
              borderRadius: 10,
              padding: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 10,
            }}
          >
            {rows.map(([label, value], idx) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minHeight: 76,
                  padding: "10px 12px",
                  border: "1px solid #e4eaf5",
                  borderRadius: 8,
                  background: idx % 2 === 0 ? "#fafcff" : "#fff",
                  gap: 4,
                }}
              >
                <div style={{ color: "#6b7a99", fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{label}</div>
                <div style={{ color: "#1f2a44", fontSize: 13, fontWeight: 600, wordBreak: "break-word" }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <a href="/find" className="btn-primary" style={{ textDecoration: "none" }}>🔍 Find My Schemes</a>
            <a href="/compare" className="btn-outline" style={{ textDecoration: "none" }}>⚖️ Compare Schemes</a>
            <a href="/chat" className="btn-outline" style={{ textDecoration: "none" }}>💬 Ask AI</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
