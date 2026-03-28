import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL   = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function getSystemPrompt(language: string, profile: Record<string, unknown>, schemeContext: string) {
  const langInstructions: Record<string, string> = {
    "हिंदी":  "हमेशा हिंदी में जवाब दें।",
    "தமிழ்": "எப்போதும் தமிழில் பதில் சொல்லுங்கள்.",
    "తెలుగు":"ఎల్లప్పుడూ తెలుగులో సమాధానం ఇవ్వండి.",
    "मराठी": "नेहमी मराठीत उत्तर द्या.",
    "বাংলা": "সবসময় বাংলায় উত্তর দিন।",
    "English":"Respond in clear simple English.",
  };
  const li = langInstructions[language] || "Respond in clear simple English.";

  let prof = "";
  if (profile?.name) {
    prof = `\nUser profile — Name:${profile.name}, Age:${profile.age}, Gender:${profile.gender}, State:${profile.state}, Occupation:${profile.occupation}, Income:Rs.${profile.income}/yr, Category:${profile.category}, BPL:${profile.bpl ? "Yes" : "No"}`;
  }

  const ctx = schemeContext ? `\n\nRelevant schemes from database:\n${schemeContext}` : "";

  return `You are YojanaAI — a warm, helpful AI assistant for Indian government welfare schemes.
${li}${prof}${ctx}

Rules:
- Be warm and helpful like a knowledgeable government officer
- Give exact amounts (Rs.6000/year, not "some amount")
- Mention documents needed for application
- Always provide the apply link when you know it
- Keep responses to 4-5 lines maximum
- End by asking if the user wants to know more
- Never invent or hallucinate scheme names or amounts
- If you don't know something, say so honestly`;
}

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { messages, language = "English", profile = {}, schemeContext = "" } = body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: getSystemPrompt(language, profile, schemeContext) },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });

  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
