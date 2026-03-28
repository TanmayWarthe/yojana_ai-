import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { readFileSync } from "fs";
import { join } from "path";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken  = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM!;
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_MODEL   = "llama-3.3-70b-versatile";

const client = twilio(accountSid, authToken);

// Simple in-memory session store
// Stores last query per user number
const sessions = new Map<string, {
  lastSchemes: string[];
  lastQuery: string;
  step: "idle" | "awaiting_selection";
}>();

function loadSchemes() {
  try {
    const raw = readFileSync(
      join(process.cwd(), "public/schemes.json"), "utf-8"
    );
    return JSON.parse(raw).schemes || [];
  } catch {
    return [];
  }
}

function searchSchemes(query: string, schemes: any[]) {
  const q = query.toLowerCase();
  const keywords = q.split(" ").filter((w) => w.length > 2);

  return schemes
    .filter((s) => {
      const text = [
        s.name, s.description, s.category,
        ...(s.tags || []),
        ...(s.eligibility_criteria || []),
      ].join(" ").toLowerCase();
      return keywords.some((k) => text.includes(k));
    })
    .slice(0, 5);
}

async function askGroq(userMessage: string, schemes: any[]): Promise<string> {
  const schemeContext = schemes.length > 0
    ? schemes.map((s, i) =>
        `${i + 1}. ${s.name} — ${s.benefits?.[0] || s.description?.slice(0, 80)}`
      ).join("\n")
    : "No specific schemes found.";

  const systemPrompt = `You are YojanaAI Saathi — a warm, helpful, and extremely simple AI assistant for rural Indian citizens.
Reply in the SAME language the user wrote in (Hindi → reply Hindi, English → reply English).
Keep replies SHORT — max 5 lines. Use WhatsApp formatting (*bold*, _italic_).
Always end with a helpful next step.

Available schemes context:
${schemeContext}

Rules:
- Give exact benefit amounts (₹6000/year not "some amount")
- Mention 1-2 key documents needed
- Always include apply link if you know it
- Never invent scheme names or amounts`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage },
      ],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ||
    "Sorry, I could not process your request. Please try again.";
}

async function sendWhatsApp(to: string, body: string) {
  await client.messages.create({
    from: fromNumber,
    to,
    body,
  });
}

function formatSchemesMessage(schemes: any[]): string {
  if (schemes.length === 0) {
    return `❌ *No schemes found.*\n\nTry asking:\n- "farmer schemes"\n- "health insurance"\n- "scholarship for students"\n- "किसान योजना"\n\n_YojanaAI — आपकी योजना, आपकी आवाज़_`;
  }

  const list = schemes
    .map((s, i) => `*${i + 1}.* ${s.name}\n   ✅ ${s.benefits?.[0] || s.description?.slice(0, 60)}`)
    .join("\n\n");

  return `🏛️ *YojanaAI — Top ${schemes.length} Schemes Found*\n\n${list}\n\n💬 Reply with number (1-${schemes.length}) for full details\n📋 Or ask about any other scheme\n\n_आपकी योजना, आपकी आवाज़_`;
}

function formatSchemeDetail(scheme: any): string {
  const benefits = (scheme.benefits || []).slice(0, 3).map((b: string) => `• ${b}`).join("\n");
  const docs = (scheme.documents_required || []).slice(0, 3).map((d: string) => `• ${d}`).join("\n");
  const applyLink = scheme.apply_link?.includes("wikipedia")
    ? `https://www.myscheme.gov.in/search?q=${encodeURIComponent(scheme.name.slice(0, 40))}`
    : scheme.apply_link || "Visit myscheme.gov.in";

  return `🏛️ *${scheme.name}*\n🏢 ${scheme.ministry}\n\n` +
    `✅ *Benefits:*\n${benefits}\n\n` +
    `📎 *Documents:*\n${docs}\n\n` +
    `🔗 *Apply:* ${applyLink}\n\n` +
    `_YojanaAI — आपकी योजना, आपकी आवाज़_`;
}

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
    const body      = formData.get("Body") as string || "";
    const from      = formData.get("From") as string || "";
    const userMsg   = body.trim();

    if (!from || !userMsg) {
      return new NextResponse("OK", { status: 200 });
    }

    // Get or create session
    if (!sessions.has(from)) {
      sessions.set(from, {
        lastSchemes: [],
        lastQuery: "",
        step: "idle",
      });
    }
    const session = sessions.get(from)!;

    // WELCOME message
    if (["hi", "hello", "नमस्ते", "help", "start", "हेलो"].includes(userMsg.toLowerCase())) {
      await sendWhatsApp(from,
        `🌾 *Welcome to YojanaAI Saathi!* (योजना साथी) 🙏\n` +
        `_Your Digital Friend for Government Schemes_\n\n` +
        `I am here to easily help you or your family find the best government schemes.\n\n` +
        `*Try asking me in your language:*\n` +
        `✅ "मुझे किसानों के लिए योजनाएं बताओ"\n` +
        `✅ "मला पीक विम्याची माहिती हवी आहे"\n` +
        `✅ "Health insurance for BPL"\n` +
        `✅ "मैं 12वीं पास हूँ, मेरे लिए क्या योजना है?"\n\n` +
        `*Just type your question or send a voice note below! 👇*`
      );
      return new NextResponse("OK", { status: 200 });
    }

    // NUMBER SELECTION — user picked a scheme from list
    const num = parseInt(userMsg);
    if (!isNaN(num) && num >= 1 && num <= 5 && session.step === "awaiting_selection") {
      const schemes = loadSchemes();
      const cached  = session.lastSchemes;

      if (cached.length >= num) {
        const scheme = schemes.find((s: any) => s.id === cached[num - 1]);
        if (scheme) {
          await sendWhatsApp(from, formatSchemeDetail(scheme));
          session.step = "idle";
          return new NextResponse("OK", { status: 200 });
        }
      }
    }

    // SEARCH — find relevant schemes
    const schemes  = loadSchemes();
    const matched  = searchSchemes(userMsg, schemes);

    // Store session
    session.lastSchemes = matched.map((s: any) => s.id);
    session.lastQuery   = userMsg;
    session.step        = matched.length > 0 ? "awaiting_selection" : "idle";

    if (matched.length > 0) {
      // Show scheme list
      await sendWhatsApp(from, formatSchemesMessage(matched));
    } else {
      // Fall back to Groq AI
      const aiReply = await askGroq(userMsg, matched);
      await sendWhatsApp(from, aiReply);
    }

    return new NextResponse("OK", { status: 200 });

  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return new NextResponse("OK", { status: 200 });
  }
}

// GET — health check
export async function GET() {
  return NextResponse.json({
    status: "YojanaAI WhatsApp Bot active",
    number: "+1 415 523 8886",
    keyword: "join beyond-zipper",
  });
}
