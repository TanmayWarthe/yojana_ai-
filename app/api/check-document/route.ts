import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const FALLBACK_VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.2-11b-vision-preview",
];

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const schemeName = formData.get("scheme_name") as string || "any government scheme";
    const language = formData.get("language") as string || "English";

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Check file size — max 4MB for Groq Vision
    if (imageFile.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Please upload under 4MB." },
        { status: 400 }
      );
    }

    // Convert to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    const langInstruction = language === "हिंदी"
      ? "Respond in Hindi (Devanagari script). Keep English terms for document field names."
      : language === "मराठी"
      ? "Respond in Marathi (Devanagari script). Keep English terms for document field names."
      : "Respond in clear simple English.";

    const systemPrompt = `You are a document verification assistant for Indian government scheme applications.
${langInstruction}

Analyze the uploaded document image and provide:
1. Document type identified
2. Readability status (clear/partially clear/unclear)
3. Key fields visible (name, date, ID number, address etc.)
4. Whether this document is sufficient for: ${schemeName}
5. Any issues, missing fields, or improvements needed

Be specific and helpful. If the document is unclear or cut off, say exactly what is wrong.
Format your response with clear sections using these exact headers:
📄 Document Type:
👁️ Readability:
✅ Fields Visible:
🎯 Valid for ${schemeName}:
⚠️ Issues / Missing:
💡 Next Steps:`;

    const modelsToTry = [VISION_MODEL, ...FALLBACK_VISION_MODELS.filter((m) => m !== VISION_MODEL)];
    let lastErrorText = "";
    let lastStatus = 500;

    for (const model of modelsToTry) {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                  },
                },
                {
                  type: "text",
                  text: systemPrompt,
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const analysis = data.choices?.[0]?.message?.content?.trim() || "";
        return NextResponse.json({ analysis, model });
      }

      lastStatus = response.status;
      lastErrorText = await response.text();
      console.error(`Groq Vision error (${model}):`, lastErrorText);
    }

    return NextResponse.json(
      { error: "Document analysis failed. Please try again." },
      { status: lastStatus || 500 }
    );

  } catch (err) {
    console.error("check-document error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
