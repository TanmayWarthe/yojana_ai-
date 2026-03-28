import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Language code mapping — gTTS uses ISO 639-1 codes
const GTTS_LANG_MAP: Record<string, string> = {
  "hi": "hi",   // Hindi
  "en": "en",   // English
  "ta": "ta",   // Tamil
  "te": "te",   // Telugu
  "mr": "mr",   // Marathi
  "bn": "bn",   // Bengali
  "pa": "pa",   // Punjabi
  "gu": "gu",   // Gujarati
  "kn": "kn",   // Kannada
  "en-IN": "en",
  "hi-IN": "hi",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const text = searchParams.get("text") || "";
  const lang = searchParams.get("lang") || "hi";

  if (!text.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  // Map to gTTS language code
  const gttsLang = GTTS_LANG_MAP[lang] || "hi";

  // Clean text — remove markdown symbols
  const cleanText = text
    .replace(/[*#_`]/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 400); // gTTS limit

  const tmpFile = join(tmpdir(), `yojana_tts_${Date.now()}.mp3`);

  try {
    // Escape single quotes in text for Python
    const escapedText = cleanText.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    const pythonScript = `
from gtts import gTTS
tts = gTTS(text='${escapedText}', lang='${gttsLang}', slow=False)
tts.save('${tmpFile}')
print('OK')
`.trim();

    execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, {
      timeout: 15000,
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (!existsSync(tmpFile)) {
      throw new Error("gTTS did not produce output file");
    }

    const audioBuffer = readFileSync(tmpFile);
    unlinkSync(tmpFile);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });

  } catch (err) {
    // Cleanup temp file if exists
    if (existsSync(tmpFile)) {
      try { unlinkSync(tmpFile); } catch {}
    }

    console.error("TTS error:", err);

    // Return error JSON — frontend will fall back to Web Speech API
    return NextResponse.json(
      { error: "TTS failed — using browser fallback" },
      { status: 500 }
    );
  }
}