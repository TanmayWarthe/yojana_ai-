import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TECH_STACK = [
  { key: "LLM (Primary)",   val: "Groq — llama-3.3-70b-versatile" },
  { key: "LLM (Fallback)",  val: "Google Gemini 1.5-flash" },
  { key: "Speech-to-Text",  val: "Deepgram nova-2 (9 Indian languages)" },
  { key: "Text-to-Speech",  val: "Web Speech API / gTTS" },
  { key: "Scheme Database", val: "219+ real government schemes" },
  { key: "Data Sources",    val: "100+ portals, Wikipedia, NSP" },
  { key: "Refresh Rate",    val: "Every 6 hours (Python scraper)" },
  { key: "Framework",       val: "Next.js 14 + TypeScript + Tailwind" },
  { key: "Eligibility",     val: "Rule-based + AI scoring engine" },
];

const FEATURES = [
  { icon: "🎙️", text: "Voice-first in 9 Indian languages — speak, don't type" },
  { icon: "📡", text: "Real-time data from 100+ govt sources, refreshed every 6 hours" },
  { icon: "🎯", text: "Cross-category eligibility engine with confidence scoring" },
  { icon: "🔔", text: "Missed benefit detection — find schemes you didn't know about" },
  { icon: "🧠", text: "Explainable AI — shows exactly why each scheme matched you" },
  { icon: "📎", text: "Auto document checklist — know exactly what to bring" },
  { icon: "📅", text: "Life event suggestions — new baby, farming, job loss and more" },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <div className="page-wrap">
          <div className="section-title">
            ℹ️ About YojanaAI
            <small>Team Exception &nbsp;|&nbsp; Pallotti Hackfest &nbsp;|&nbsp; PS-3</small>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

            <div className="about-card">
              <div className="about-card-title">🛠️ Technology Stack</div>
              {TECH_STACK.map(({ key, val }) => (
                <div key={key} className="tech-row">
                  <span style={{ color: "#6b7a99", fontWeight: 600, fontSize: 12 }}>{key}</span>
                  <span style={{ color: "#2d3a5a", fontWeight: 500, fontSize: 13, textAlign: "right", maxWidth: "60%" }}>{val}</span>
                </div>
              ))}
            </div>

            <div className="about-card">
              <div className="about-card-title">⭐ 7 Unique Features</div>
              {FEATURES.map(({ icon, text }) => (
                <div key={icon} className="feature-item">
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <span style={{ color: "#374567", fontSize: 13, lineHeight: 1.55 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PROBLEM STATEMENT */}
          <div className="about-card" style={{ marginBottom: 16 }}>
            <div className="about-card-title">🎯 Problem Statement & Impact</div>
            <p style={{ fontSize: 14, color: "#374567", lineHeight: 1.75 }}>
              India runs <strong>thousands of welfare and subsidy schemes</strong> but most beneficiaries remain unaware.
              Studies show that up to <strong>85–97% of eligible poor households</strong> in some states don&apos;t access
              schemes simply because they don&apos;t know about them. Language is a major barrier — government forms and
              websites are usually in English or Hindi, which are incomprehensible to much of the population.
            </p>
            <p style={{ fontSize: 14, color: "#374567", lineHeight: 1.75, marginTop: 12 }}>
              YojanaAI bridges this gap with an AI assistant that speaks 9 Indian languages, understands voice
              queries, and delivers personalised scheme recommendations — making India&apos;s welfare infrastructure
              accessible to every citizen.
            </p>
          </div>

          <div className="box box-warn">
            <strong>Disclaimer / अस्वीकरण:</strong> YojanaAI provides scheme information for awareness only.
            This is NOT an official government portal. For actual applications, please visit the respective
            ministry website or your nearest CSC (Common Service Centre / Jan Seva Kendra / जन सेवा केंद्र).
          </div>

          <div className="box box-info" style={{ marginTop: 12 }}>
            🏆 <strong>Pallotti Hackfest — Problem Statement 3</strong><br />
            Built by <strong>Team Exception</strong> to solve India&apos;s scheme awareness gap using AI, multilingual NLP,
            and real-time government data scraping.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
