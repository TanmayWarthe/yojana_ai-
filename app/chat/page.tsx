"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LANG_MAP, LANGUAGES } from "@/lib/constants";
import { loadProfile } from "@/lib/profile";
import type { ChatMessage, CitizenProfile, Language } from "@/types";

// ── Large pool of realistic quick questions ──────────────────────────────────
const QUESTION_POOL: Record<string, string[]> = {
  "English": [
    "I am a farmer in Maharashtra with 2 acres of land. Which schemes can I apply for?",
    "What documents do I need to apply for PM Awas Yojana (PMAY)?",
    "How can a BPL family get free health insurance under Ayushman Bharat?",
    "My daughter scored 85% in Class 12. What scholarships are available for her?",
    "I want to start a small tailoring business. Can I get a MUDRA loan?",
    "What pension schemes are available for senior citizens above 60 years?",
    "How to check if I am eligible for PM-KISAN Samman Nidhi?",
    "I am a construction worker. Which welfare schemes can help me?",
    "My family income is below ₹2.5 lakh. Which schemes can I benefit from?",
    "How to get Kisan Credit Card (KCC) and what are the interest rates?",
    "What is Sukanya Samriddhi Yojana and how much can I deposit?",
    "My husband passed away. What widow pension and support schemes exist?",
    "I am an SC student pursuing B.Tech. Which scholarships can I avail?",
    "How to apply for free LPG connection under Ujjwala Yojana 2.0?",
    "What is PM Vishwakarma Yojana? Can blacksmiths and carpenters benefit?",
    "I have a disability certificate (40%). Which special schemes are for me?",
    "How to get free treatment under Ayushman Bharat PMJAY in government hospitals?",
    "What is the Atal Pension Yojana and how much pension will I get at age 60?",
    "I lost my job during COVID. Are there any employment or skill training schemes?",
    "How can tribal families get house pattas under Forest Rights Act?",
    "What is PM Garib Kalyan Anna Yojana? Am I eligible for free ration?",
    "My son wants to study MBBS. Are there fee waivers for OBC students?",
    "How to apply for PMEGP loan to open a small grocery shop?",
    "What maternity benefits can a pregnant woman get from the government?",
    "I am a fisherman in Kerala. Which central and state schemes help me?",
    "Can retired army personnel get any special government benefits?",
    "What is Standup India scheme? How much loan can women entrepreneurs get?",
    "I want to install a solar panel on my rooftop. Is there a government subsidy?",
  ],
  "हिंदी": [
    "मैं एक किसान हूँ और मेरे पास 2 एकड़ ज़मीन है। मुझे कौन सी योजनाएं मिल सकती हैं?",
    "PM आवास योजना के लिए कौन से दस्तावेज़ चाहिए?",
    "BPL परिवार को आयुष्मान भारत में मुफ्त स्वास्थ्य बीमा कैसे मिलेगा?",
    "मेरी बेटी ने 12वीं में 85% अंक प्राप्त किए। उसके लिए कौन सी छात्रवृत्ति है?",
    "मैं एक छोटा सिलाई का बिज़नेस शुरू करना चाहती हूँ। क्या मुझे MUDRA लोन मिल सकता है?",
    "60 साल से ऊपर के बुजुर्गों के लिए कौन सी पेंशन योजना है?",
    "PM-KISAN सम्मान निधि के लिए पात्रता कैसे जांचें?",
    "मैं एक निर्माण मज़दूर हूँ। मेरे लिए कौन सी कल्याणकारी योजनाएं हैं?",
    "मेरे परिवार की आय ₹2.5 लाख से कम है। कौन सी योजनाएं फायदेमंद होंगी?",
    "किसान क्रेडिट कार्ड (KCC) कैसे मिलता है और ब्याज दर क्या है?",
    "सुकन्या समृद्धि योजना क्या है और इसमें कितना जमा कर सकते हैं?",
    "मेरे पति का देहांत हो गया है। विधवा पेंशन और सहायता योजनाएं क्या हैं?",
    "मैं SC वर्ग का B.Tech छात्र हूँ। कौन सी छात्रवृत्तियां मिल सकती हैं?",
    "उज्ज्वला योजना 2.0 में मुफ्त LPG कनेक्शन कैसे पाएं?",
    "PM विश्वकर्मा योजना क्या है? क्या लोहार और बढ़ई को लाभ मिलेगा?",
    "प्रधानमंत्री गरीब कल्याण अन्न योजना क्या है? क्या मुझे मुफ्त राशन मिलेगा?",
    "गर्भवती महिलाओं को सरकार से कौन से मातृत्व लाभ मिलते हैं?",
    "अटल पेंशन योजना क्या है? 60 साल की उम्र में कितनी पेंशन मिलेगी?",
  ],
  "தமிழ்": [
    "நான் ஒரு விவசாயி, எனக்கு PM-KISAN கிடைக்குமா?",
    "ஆயுஷ்மான் பாரத் திட்டத்தில் இலவச சிகிச்சை எப்படி பெறுவது?",
    "SC மாணவர்களுக்கு உதவித்தொகை திட்டங்கள் என்ன?",
    "சிறு தொழில் தொடங்க MUDRA கடன் எப்படி பெறுவது?",
    "மூத்த குடிமக்களுக்கான ஓய்வூதிய திட்டங்கள் என்ன?",
    "PM ஆவாஸ் யோஜனா மூலம் வீடு கட்ட எவ்வளவு மானியம் கிடைக்கும்?",
  ],
  "తెలుగు": [
    "నేను రైతును, PM-KISAN కోసం ఎలా అప్లై చేయాలి?",
    "ఆయుష్మాన్ భారత్ ద్వారా ఉచిత వైద్యం ఎలా పొందాలి?",
    "SC విద్యార్థులకు స్కాలర్‌షిప్‌లు ఏమిటి?",
    "చిన్న వ్యాపారం కోసం MUDRA లోన్ ఎలా తీసుకోవాలి?",
    "సీనియర్ సిటిజన్ల కోసం పెన్షన్ పథకాలు ఏమిటి?",
  ],
  "मराठी": [
    "मी एक शेतकरी आहे, PM-KISAN साठी कसे अर्ज करावे?",
    "आयुष्मान भारत अंतर्गत मोफत उपचार कसे मिळतात?",
    "SC विद्यार्थ्यांसाठी शिष्यवृत्ती योजना कोणत्या?",
    "छोटा व्यवसाय सुरू करण्यासाठी MUDRA कर्ज कसे मिळते?",
    "ज्येष्ठ नागरिकांसाठी पेन्शन योजना कोणती?",
    "PM आवास योजनेत घर बांधण्यासाठी किती अनुदान मिळते?",
  ],
  "বাংলা": [
    "আমি একজন কৃষক, PM-KISAN এর জন্য কীভাবে আবেদন করব?",
    "আয়ুষ্মান ভারত প্রকল্পে বিনামূল্যে চিকিৎসা কীভাবে পাব?",
    "SC ছাত্রদের জন্য কোন কোন বৃত্তি আছে?",
    "ছোট ব্যবসার জন্য MUDRA ঋণ কীভাবে পাব?",
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

/** Pick N random items from array without repeats */
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export default function ChatPage() {
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [language,      setLanguage]      = useState<Language>("हिंदी");
  const [recording,     setRecording]     = useState(false);
  const [sttStatus,     setSttStatus]     = useState<"idle"|"recording"|"transcribing"|"done"|"error">("idle");
  const [sttMsg,        setSttMsg]        = useState("");
  const [profile, setProfile] = useState<Partial<CitizenProfile>>({});
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);

  const bodyRef    = useRef<HTMLDivElement>(null);
  const mediaRef   = useRef<MediaRecorder | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const mimeRef    = useRef("audio/webm");

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

  // Randomize quick questions on load and when language changes
  useEffect(() => {
    const pool = QUESTION_POOL[language] || QUESTION_POOL["English"];
    setQuickQuestions(pickRandom(pool, 5));
  }, [language]);

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
    };
  }, []);


  // ── Send message to AI ───────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const ts      = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { role: "user", content: text.trim(), timestamp: ts };
    const history = [...messages, userMsg];

    setMessages(history);
    setInput("");
    setLoading(true);

    // Refresh quick questions after send
    const pool = QUESTION_POOL[language] || QUESTION_POOL["English"];
    setQuickQuestions(pickRandom(pool, 5));

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

    } catch {
      setMessages([...history, {
        role: "assistant",
        content: "❌ Connection error. Check your API key and internet connection.",
        timestamp: ts,
      }]);
    }

    setLoading(false);
  }, [messages, loading, language, profile]);

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

            {messages.length > 0 && (
              <button
                className="btn-outline btn-sm"
                onClick={() => setMessages([])}
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
                    {m.role === "assistant" ? <FormattedMessage text={m.content} /> : m.content}
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

            {/* Quick suggestions — bigger and randomized */}
            <div style={{ padding:"14px 20px 0", borderTop:"1px solid #f0f4fa" }}>
              <div style={{ fontSize:12, color:"#002366", fontWeight:700, marginBottom:10,
                textTransform:"uppercase", letterSpacing:"0.06em",
                display:"flex", alignItems:"center", gap:8 }}>
                <span>💡 Quick Questions</span>
                <button
                  onClick={() => {
                    const pool = QUESTION_POOL[language] || QUESTION_POOL["English"];
                    setQuickQuestions(pickRandom(pool, 5));
                  }}
                  style={{
                    background: "none", border: "1px solid #d0d9e8", borderRadius: 6,
                    padding: "2px 8px", fontSize: 11, cursor: "pointer", color: "#8898aa",
                  }}
                  title="Refresh questions"
                >
                  🔄 Refresh
                </button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                {quickQuestions.map((s, i) => (
                  <button
                    key={`${s}-${i}`}
                    className="quick-q-btn-large"
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                  >
                    <span style={{ marginRight:8, fontSize:16 }}>
                      {["🌾","🏥","🎓","🏠","💼","👩","⚙️","🤝","🛡️","💰"][i % 10]}
                    </span>
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

      {/* Quick question large button styles */}
      <style>{`
        .quick-q-btn-large {
          display: flex;
          align-items: center;
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border: 1.5px solid #e0e6f0;
          border-radius: 10px;
          background: linear-gradient(135deg, #fafbff, #f5f7fc);
          color: #1a2340;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.5;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .quick-q-btn-large:hover:not(:disabled) {
          border-color: #002366;
          background: linear-gradient(135deg, #eef2ff, #e8ecfa);
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(0,35,102,0.1);
          color: #002366;
          font-weight: 600;
        }
        .quick-q-btn-large:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Formatted Message Styles ── */
        .fmt-msg {
          font-size: 13.5px;
          line-height: 1.7;
          color: #1a2340;
        }
        .fmt-spacer {
          height: 8px;
        }
        .fmt-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #002366;
          margin: 14px 0 6px;
          padding-bottom: 4px;
          border-bottom: 1.5px solid #e8ecf4;
          letter-spacing: 0.02em;
        }
        .fmt-header:first-child {
          margin-top: 0;
        }
        .fmt-header-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        .fmt-bullet {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 4px 0 4px 4px;
          font-size: 13px;
          color: #374567;
          line-height: 1.65;
        }
        .fmt-bullet-dot {
          color: #002366;
          font-weight: 700;
          flex-shrink: 0;
          min-width: 14px;
          margin-top: 1px;
        }
        .fmt-bullet-text {
          flex: 1;
        }
        .fmt-para {
          margin: 4px 0;
          color: #374567;
          font-size: 13.5px;
          line-height: 1.7;
        }
        .fmt-bold {
          color: #002366;
          font-weight: 700;
        }
        .fmt-link {
          color: #1565c0;
          text-decoration: underline;
          text-decoration-style: dotted;
          text-underline-offset: 2px;
          word-break: break-all;
          font-weight: 600;
          font-size: 12px;
        }
        .fmt-link:hover {
          color: #002366;
          text-decoration-style: solid;
        }
      `}</style>
    </>
  );
}

// ── Formatted Message Component ──────────────────────────────────────────────
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="fmt-msg">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="fmt-spacer" />;

        // Section headers with emoji (e.g. "📋 Eligibility:" or "**Benefits:**")
        const headerMatch = trimmed.match(/^((?:[\p{Emoji}\u200d\ufe0f]+\s*)?\*\*(.+?)\*\*:?\s*)$/u)
          || trimmed.match(/^((?:[\p{Emoji}\u200d\ufe0f]+\s*)(.+?):)\s*$/u);
        if (headerMatch && trimmed.length < 60) {
          const content = headerMatch[2] || headerMatch[1];
          const emoji = trimmed.match(/^[\p{Emoji}\u200d\ufe0f]+/u)?.[0] || "";
          return (
            <div key={i} className="fmt-header">
              {emoji && <span className="fmt-header-icon">{emoji}</span>}
              <span>{content.replace(/^\*\*|\*\*$/g, "").replace(/^[\p{Emoji}\u200d\ufe0f]+\s*/u, "")}</span>
            </div>
          );
        }

        // Bullet points (•, -, *, ✅, ✓, ▸)
        const bulletMatch = trimmed.match(/^([•\-\*✅✓▸►➤]|\d+[\.\)]?)\s+(.+)/);
        if (bulletMatch) {
          return (
            <div key={i} className="fmt-bullet">
              <span className="fmt-bullet-dot">
                {/\d/.test(bulletMatch[1]) ? bulletMatch[1] : "•"}
              </span>
              <span className="fmt-bullet-text">
                <FormatInline text={bulletMatch[2]} />
              </span>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="fmt-para">
            <FormatInline text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

// ── Inline text formatting (bold, links) ─────────────────────────────────────
function FormatInline({ text }: { text: string }) {
  // Split on **bold** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="fmt-bold">{part.slice(2, -2)}</strong>;
        }
        // Auto-link URLs
        const urlParts = part.split(/(https?:\/\/[^\s,)]+)/g);
        return urlParts.map((seg, j) => {
          if (seg.match(/^https?:\/\//)) {
            return (
              <a key={`${i}-${j}`} href={seg} target="_blank" rel="noopener noreferrer"
                className="fmt-link">{seg.replace(/^https?:\/\//, "").slice(0, 35)}</a>
            );
          }
          return <span key={`${i}-${j}`}>{seg}</span>;
        });
      })}
    </>
  );
}