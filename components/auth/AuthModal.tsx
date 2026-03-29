"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" 
        ? { email, password } 
        : { name, email, phone, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 35, 102, 0.4)",
      backdropFilter: "blur(4px)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* Header Tape */}
        <div style={{
          display: "flex", width: "100%", height: 6
        }}>
          <div style={{ flex: 1, background: "#FF9933" }} />
          <div style={{ flex: 1, background: "#FFFFFF" }} />
          <div style={{ flex: 1, background: "#138808" }} />
        </div>

        <button 
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none",
            fontSize: 20, cursor: "pointer", color: "var(--text-muted)"
          }}
        >
          ✕
        </button>

        <div style={{ padding: "32px 32px 24px" }}>
          <h2 style={{ 
            marginTop: 0, color: "var(--navy)", fontSize: 24, fontWeight: 800,
            marginBottom: 8, display: "flex", alignItems: "center", gap: 10
          }}>
            <span style={{ fontSize: 28 }}>🏛️</span>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 0, marginBottom: 24, lineHeight: 1.5 }}>
            {mode === "login" 
              ? "Sign in to access your saved schemes and profile." 
              : "Register to personalize your scheme recommendations."}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "signup" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="form-input"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--navy)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "14px",
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 8,
                opacity: loading ? 0.7 : 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  {mode === "login" ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                 mode === "login" ? "Sign In →" : "Sign Up →"
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
            {mode === "login" ? "New to YojanaAI? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              style={{
                background: "none", border: "none", padding: 0, color: "var(--orange)", 
                fontWeight: 700, cursor: "pointer", textDecoration: "underline"
              }}
            >
              {mode === "login" ? "Create an account" : "Sign in here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
