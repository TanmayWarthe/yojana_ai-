import { NextRequest, NextResponse } from "next/server";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/flac",
  "audio/mp4",
  "audio/x-m4a",
]);

function normalizeLanguage(raw: string): string {
  const value = (raw || "hi").trim().toLowerCase();
  const short = value.split("-")[0];
  const allowed = new Set(["hi", "en", "ta", "te", "mr", "bn", "pa", "gu", "kn", "ml"]);
  return allowed.has(short) ? short : "hi";
}

function contentTypeFromFilename(fileName: string): string | null {
  const lower = (fileName || "").toLowerCase();
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".ogg") || lower.endsWith(".oga")) return "audio/ogg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".flac")) return "audio/flac";
  if (lower.endsWith(".m4a")) return "audio/x-m4a";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".mp4")) return "audio/mp4";
  return null;
}

function normalizeContentType(raw: string, fileName: string): string {
  const base = (raw || "").split(";")[0].trim().toLowerCase();
  if (ALLOWED_CONTENT_TYPES.has(base)) return base;
  return contentTypeFromFilename(fileName) || "audio/webm";
}

async function transcribeWithDeepgram(audioBuffer: ArrayBuffer, contentType: string, language?: string) {
  const qs = new URLSearchParams({
    model: "nova-2",
    smart_format: "true",
    punctuate: "true",
  });
  if (language) qs.set("language", language);

  return fetch(`https://api.deepgram.com/v1/listen?${qs.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": contentType,
      Accept: "application/json",
    },
    body: audioBuffer,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json({ error:"DEEPGRAM_API_KEY not configured" }, { status:500 });
    }

    const formData = await req.formData();
    const audioField = formData.get("audio");
    const language = normalizeLanguage((formData.get("language") as string) || "hi");

    if (!(audioField instanceof Blob)) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const audio = audioField;
    const fileName = audioField instanceof File && audioField.name ? audioField.name : "recording.webm";

    const audioBuffer = await audio.arrayBuffer();

    if (audioBuffer.byteLength < 500) {
      return NextResponse.json({ error:"Recording too short — speak for at least 2 seconds" }, { status:400 });
    }

    // Cap size — frontend has 30s limit but just in case
    if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error:"Recording too long — please keep it under 30 seconds" }, { status:400 });
    }

    const contentType = normalizeContentType(audio.type || "", fileName);

    let dgRes = await transcribeWithDeepgram(audioBuffer, contentType, language);

    if (!dgRes.ok && (dgRes.status === 400 || dgRes.status === 422)) {
      await new Promise((r) => setTimeout(r, 250));
      dgRes = await transcribeWithDeepgram(audioBuffer, contentType);
    }

    if (!dgRes.ok) {
      const err = await dgRes.text();
      return NextResponse.json(
        { error:`Transcription failed (${dgRes.status}). Please try again.`, detail:err.slice(0,220) },
        { status: dgRes.status }
      );
    }

    const data       = await dgRes.json();
    const alt        = data?.results?.channels?.[0]?.alternatives?.[0];
    const transcript = alt?.transcript?.trim() || "";
    const confidence = alt?.confidence ?? 0;

    if (!transcript) {
      return NextResponse.json({ error:"No speech detected — speak louder or try again" }, { status:422 });
    }

    return NextResponse.json({ transcript, confidence });

  } catch (err) {
    console.error("STT error:", err);
    return NextResponse.json({ error:"Transcription failed" }, { status:500 });
  }
}