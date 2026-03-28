"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LANG_MAP, LANGUAGES } from "@/lib/constants";
import { loadProfile } from "@/lib/profile";
import type { ChatMessage, CitizenProfile, Language } from "@/types";

const SUGGESTIONS: Record<string, string[]> = {
  "English":  [
    "What is PM-KISAN?",
    "Tell me about Ayushman Bharat",
    "Schemes for farmers in Maharashtra",
    "How to apply for MUDRA loan?",
    "Scholarship for SC students",
    "Housing scheme for BPL family",
  ],
  "हिंदी": [
    "PM-KISAN क्या है?",
    "मैं किसान हूँ, कौन सी योजना?",
    "Ayushman Bharat के बारे में बताओ",
    "Scholarship कैसे मिलेगी?",
    "MUDRA loan kaise milega?",
    "BPL परिवार के लिए योजनाएं",
  ],
  "தமிழ்": [
    "PM-KISAN என்றால் என்ன?",
    "Ayushman Bharat பற்றி சொல்லுங்கள்",
    "விவசாயிகளுக்கான திட்டங்கள்",
  ],
  "తెలుగు": [
    "PM-KISAN అంటే ఏమిటి?",
    "రైతులకు పథకాలు ఏమిటి?",
    "Ayushman Bharat గురించి చెప్పండి",
  ],
  "मराठी": [
    "PM-KISAN म्हणजे काय?",
    "शेतकऱ्यांसाठी योजना सांगा",
    "Ayushman Bharat बद्दल सांगा",
  ],
  "বাংলা": [
    "PM-KISAN কী?",
    "কৃষকদের জন্য প্রকল্প কী?",
  ],
};

const WELCOME: Record<string, string> = {
  "हिंदी":   "नमस्ते! 🙏 मैं YojanaAI हूँ। सरकारी योजनाओं में मदद के लिए यहाँ हूँ। हिंदी में पूछें!",
  "English":  "Hello! 🙏 I'm YojanaAI — your guide to Indian government welfare schemes. Ask me anything!",
  "தமிழ்":  "வணக்கம்! 🙏 நான் YojanaAI. அரசு திட்டங்களைப் பற்றி கேளுங்கள்.",
  "తెలుగు": "నమస్కారం! 🙏 నేను YojanaAI. ప్రభుత్వ పథకాల గురించి అడగండి.",
  "मराठी":  "नमस्कार! 🙏 मी YojanaAI. सरकारी योजनांसाठी मदत करतो.",
  "বাংলা":  "নমস্কার! 🙏 আমি YojanaAI. সরকারি প্রকল্প সম্পর্কে জিজ্ঞেস করুন।",
  "ਪੰਜਾਬੀ": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 🙏 ਮੈਂ YojanaAI ਹਾਂ। ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਬਾਰੇ ਪੁੱਛੋ।",
  "ಕನ್ನಡ":  "ನಮಸ್ಕಾರ! 🙏 ನಾನು YojanaAI. ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ.",
  "ગુજરાતી": "નમસ્તે! 🙏 હું YojanaAI છું. સરકારી યોજનાઓ વિશે પૂછો.",
};

export default function ChatPage() {
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [language,      setLanguage]      = useState<Language>("हिंदी");
  const [recording,     setRecording]     = useState(false);
  const [ttsEnabled,    setTtsEnabled]    = useState(true);
  const [sttStatus,     setSttStatus]     = useState<"idle"|"recording"|"transcribing"|"done"|"error">("idle");
  const [sttMsg,        setSttMsg]        = useState("");
  const [profile, setProfile] = useState<Partial<CitizenProfile>>({});

  const bodyRef    = useRef<HTMLDivElement>(null);
  const mediaRef   = useRef<MediaRecorder | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const mimeRef    = useRef("audio/webm");
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sttTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Pre-fill chat input from URL ?scheme= parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const schemeName = params.get("scheme");
    if (schemeName) {
      setInput(`Tell me more about ${schemeName} — who is eligible and how to apply?`);
    }
  }, []);

  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recTimerRef.current) clearTimeout(recTimerRef.current);
      if (sttTimerRef.current) clearTimeout(sttTimerRef.current);

      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        try { mediaRef.current.stop(); } catch {}
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── TTS: gTTS via /api/tts, fallback to Web Speech API ──────────
const speakText = useCallback(async (text: string) => {
  if (!ttsEnabled || !text.trim()) return;

  // Stop everything already playing
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  window.speechSynthesis?.cancel();

  const langCode  = LANG_MAP[language]?.tts || "hi";
  const cleanText = text.replace(/[*#_`]/g, "").trim().slice(0, 350);

  let gttsOk = false;

  try {
    const res = await fetch(
      `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${langCode}`
    );

    if (res.ok) {
      const blob     = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio    = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      try {
        await audio.play();
        gttsOk = true;
      } catch {
        // Chrome autoplay blocked — destroy and fall through to Web Speech
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        gttsOk = false;
      }
    }
  } catch {
    // fetch/network error — fall through
  }

  // Web Speech ONLY if gTTS did not play
  if (!gttsOk && typeof window !== "undefined" && "speechSynthesis" in window) {
    const bcp47: Record<string, string> = {
      hi: "hi-IN", en: "en-IN", ta: "ta-IN", te: "te-IN",
      mr: "mr-IN", bn: "bn-IN", pa: "pa-IN", gu: "gu-IN", kn: "kn-IN",
    };
    const utter  = new SpeechSynthesisUtterance(cleanText);
    utter.lang   = bcp47[langCode] || "hi-IN";
    utter.rate   = 0.9;
    window.speechSynthesis.speak(utter);
  }
}, [ttsEnabled, language]);

  // ── Send message to AI ───────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const ts      = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { role: "user", content: text.trim(), timestamp: ts };
    const history = [...messages, userMsg];

    setMessages(history);
    setInput("");
    setLoading(true);

    // Find relevant schemes for context
    let schemeContext = "";
    try {
      const r   = await fetch("/api/schemes");
      const db  = await r.json();
      const q   = text.toLowerCase();
      const rel = (db.schemes || [])
        .filter((s: { name: string; description: string; tags?: string[] }) => {
          const t = [s.name, s.description, ...(s.tags || [])].join(" ").toLowerCase();
          return q.split(" ").some((w: string) => w.length > 3 && t.includes(w));
        })
        .slice(0, 5);
      schemeContext = rel
        .map((s: { name: string; description: string; benefits?: string[]; apply_link?: string }) =>
          `- ${s.name}: ${s.description} | Benefits: ${(s.benefits || []).slice(0, 2).join(", ")} | Apply: ${s.apply_link || ""}`
        )
        .join("\n");
    } catch {}

    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          language,
          profile,
          schemeContext,
        }),
      });

      const data  = await res.json();
      const reply = data.reply || "Sorry, I couldn't respond. Please try again.";
      const replyMsg: ChatMessage = { role: "assistant", content: reply, timestamp: ts };

      setMessages([...history, replyMsg]);

      // Speak the reply
      speakText(reply);

    } catch {
      setMessages([...history, {
        role: "assistant",
        content: "❌ Connection error. Check your API key and internet connection.",
        timestamp: ts,
      }]);
    }

    setLoading(false);
  }, [messages, loading, language, profile, speakText]);

  // ── Voice recording ──────────────────────────────────────────────
  function clearSttTimer() {
    if (sttTimerRef.current) {
      clearTimeout(sttTimerRef.current);
      sttTimerRef.current = null;
    }
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function scheduleSttReset(ms: number) {
    clearSttTimer();
    sttTimerRef.current = setTimeout(() => {
      setSttStatus("idle");
      setSttMsg("");
    }, ms);
  }

  const transcribeAudio = useCallback(async (blob: Blob, mimeType: string) => {
    clearSttTimer();
    setSttStatus("transcribing");
    setSttMsg("Transcribing your voice...");

    const ext = mimeType.includes("ogg")
      ? "ogg"
      : mimeType.includes("wav")
      ? "wav"
      : mimeType.includes("mp4") || mimeType.includes("m4a")
      ? "m4a"
      : mimeType.includes("mpeg") || mimeType.includes("mp3")
      ? "mp3"
      : "webm";

    let lastError = "Could not transcribe — please try again";

    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const fd = new FormData();
      fd.append("audio", blob, `recording.${ext}`);
      fd.append("language", LANG_MAP[language]?.dg || "hi");

      try {
        const res = await fetch("/api/stt", { method: "POST", body: fd, signal: controller.signal });
        const data = await res.json();

        if (res.ok && data?.transcript) {
          const transcript = String(data.transcript).trim();
          const confidence = typeof data.confidence === "number" ? Math.round(data.confidence * 100) : null;

          if (!transcript) {
            lastError = "No speech detected — speak clearly and try again";
          } else {
            setInput(transcript);
            setSttStatus("done");
            setSttMsg(
              confidence !== null
                ? `✅ Heard: "${transcript}" (${confidence}% confidence)`
                : `✅ Heard: "${transcript}"`
            );

            setTimeout(() => {
              setSttStatus("idle");
              setSttMsg("");
              sendMessage(transcript);
            }, 700);
            clearTimeout(timeout);
            return;
          }
        } else {
          lastError = data?.error || `Transcription failed (${res.status})`;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        lastError = msg.includes("abort")
          ? "Transcription timed out. Please retry in a quiet place."
          : "Transcription failed — please type your question";
      } finally {
        clearTimeout(timeout);
      }

      if (attempt < 2) await new Promise((r) => setTimeout(r, 250));
    }

    setSttStatus("error");
    setSttMsg(lastError);
    scheduleSttReset(4500);
  }, [language, sendMessage]);

  async function toggleRecording() {
    if (sttStatus === "transcribing") return;

    if (recording) {
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
      }
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setSttStatus("error");
      setSttMsg("Microphone is not supported in this browser");
      scheduleSttReset(4000);
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setSttStatus("error");
      setSttMsg("Voice recording is not supported in this browser");
      scheduleSttReset(4000);
      return;
    }

    try {
      clearSttTimer();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ];
      const selectedType = preferredTypes.find((m) => MediaRecorder.isTypeSupported(m));
      const mr = selectedType
        ? new MediaRecorder(stream, { mimeType: selectedType })
        : new MediaRecorder(stream);

      mediaRef.current = mr;
      chunksRef.current = [];
      mimeRef.current = mr.mimeType || selectedType || "audio/webm";

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onerror = () => {
        setRecording(false);
        setSttStatus("error");
        setSttMsg("Recording failed. Please retry.");
        scheduleSttReset(3500);
        stopStream();
      };

      mr.onstop = async () => {
        if (recTimerRef.current) {
          clearTimeout(recTimerRef.current);
          recTimerRef.current = null;
        }

        const mimeType = chunksRef.current[0]?.type || mimeRef.current || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });

        mediaRef.current = null;
        chunksRef.current = [];
        setRecording(false);
        stopStream();

        if (blob.size < 700) {
          setSttStatus("error");
          setSttMsg("Recording too short — speak for at least 1-2 seconds");
          scheduleSttReset(3500);
          return;
        }

        await transcribeAudio(blob, mimeType);
      };

      mr.start(250);
      setRecording(true);
      setSttStatus("recording");
      setSttMsg("🔴 Listening... speak now, then press Stop");

      recTimerRef.current = setTimeout(() => {
        if (mediaRef.current && mediaRef.current.state === "recording") {
          setSttMsg("Stopping recording and preparing transcript...");
          mediaRef.current.stop();
        }
      }, 20000);
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      const denied = msg.includes("denied") || msg.includes("notallowed");

      setRecording(false);
      setSttStatus("error");
      setSttMsg(denied
        ? "Microphone access denied. Please allow mic permission and retry."
        : "Could not start microphone. Check device permission and retry.");
      scheduleSttReset(4500);
      stopStream();
    }
  }

  const suggestions = SUGGESTIONS[language] || SUGGESTIONS["English"];

  return (
    <>
      <Header />
      <main>
        <div className="page-wrap">
          <div className="section-title">
            💬 Ask AI Assistant
            <small>अपनी भाषा में पूछें — Ask in your language</small>
          </div>

          {/* SETTINGS ROW */}
          <div style={{ display:"flex", gap:14, marginBottom:16, flexWrap:"wrap", alignItems:"flex-end" }}>
            <div className="form-group" style={{ flex:2, minWidth:160 }}>
              <label className="form-label">🌐 Language / भाषा</label>
              <select
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>

            <label className="form-checkbox" style={{ flex:1, minWidth:180, cursor:"pointer" }}>
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={(e) => {
                  setTtsEnabled(e.target.checked);
                  if (!e.target.checked && audioRef.current) audioRef.current.pause();
                  if (!e.target.checked) window.speechSynthesis?.cancel();
                }}
              />
              🔊 Read AI replies aloud
            </label>

            {messages.length > 0 && (
              <button
                className="btn-outline btn-sm"
                onClick={() => { setMessages([]); window.speechSynthesis?.cancel(); }}
              >
                🗑️ Clear Chat
              </button>
            )}
          </div>

          {/* CHAT SHELL */}
          <div className="chat-shell">

            {/* Header bar */}
            <div className="chat-header">
              <div className="chat-avatar">🤖</div>
              <div className="chat-header-info">
                <div className="chat-agent-name">YojanaAI Assistant</div>
                <div className="chat-status">
                  ● Online &nbsp;·&nbsp; Responding in {language}
                </div>
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", textAlign:"right" }}>
                Powered by Groq<br />llama-3.3-70b
              </div>
            </div>

            {/* Messages area */}
            <div className="chat-body" ref={bodyRef}>

              {/* Welcome */}
              <div className="chat-bubble-bot">
                <div className="bubble-inner-bot">
                  {WELCOME[language] || WELCOME["English"]}
                </div>
                <div className="bubble-time">YojanaAI</div>
              </div>

              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-bot"}>
                  <div className={m.role === "user" ? "bubble-inner-user" : "bubble-inner-bot"}>
                    {m.content}
                  </div>
                  <div className="bubble-time">
                    {m.role === "user" ? "You" : "YojanaAI"} &nbsp;·&nbsp; {m.timestamp}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat-bubble-bot">
                  <div className="bubble-inner-bot" style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span className="spinner" style={{ width:16, height:16, borderWidth:2 }} />
                    <span style={{ color:"#8898aa", fontStyle:"italic" }}>YojanaAI is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick suggestions */}
            <div style={{ padding:"10px 20px 0", borderTop:"1px solid #f0f4fa" }}>
              <div style={{ fontSize:11, color:"#8898aa", fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                Quick questions
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    className="quick-q-btn"
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input area */}
            <div className="chat-input-area">

              {/* STT status banner */}
              {sttStatus !== "idle" && (
                <div
                  className={`box ${
                    sttStatus === "error"         ? "box-error"
                    : sttStatus === "done"        ? "box-ok"
                    : sttStatus === "recording"   ? "box-warn"
                    : "box-info"
                  }`}
                  style={{ marginBottom:10, padding:"8px 14px", fontSize:13 }}
                >
                  {sttMsg}
                </div>
              )}

              <textarea
                className="chat-textarea"
                rows={2}
                placeholder={
                  language === "हिंदी"
                    ? "यहाँ अपना सवाल लिखें या माइक बटन दबाएं..."
                    : "Type your question or press the mic button..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                disabled={sttStatus === "transcribing"}
              />

              <div style={{ display:"flex", gap:10, marginTop:10 }}>
                <button
                  className="btn-primary"
                  style={{ flex:3 }}
                  onClick={() => sendMessage(input)}
                  disabled={loading || recording || !input.trim() || sttStatus === "transcribing"}
                >
                  {loading ? "⏳ Sending..." : "📨 Send / भेजें"}
                </button>

                <button
                  className={recording ? "btn-primary" : "btn-outline"}
                  style={{
                    flex:1,
                    background: recording ? "#dc2626" : undefined,
                    borderColor: recording ? "#dc2626" : undefined,
                    color: recording ? "#fff" : undefined,
                  }}
                  onClick={toggleRecording}
                  disabled={loading || sttStatus === "transcribing"}
                  title={recording ? "Click to stop recording" : `Record voice in ${language}`}
                >
                  {recording ? "⏹ Stop" : "🎤 Voice"}
                </button>
              </div>

              <div style={{ fontSize:11, color:"#aab", marginTop:8, textAlign:"center" }}>
                Voice auto-sends after transcription &nbsp;·&nbsp; Shift+Enter for new line
              </div>
            </div>
          </div>

          <div className="box box-warn" style={{ marginTop:16 }}>
            ⚠️ AI responses are for awareness only. Always verify on official government portals before applying.
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}