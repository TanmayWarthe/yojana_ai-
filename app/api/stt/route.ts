import { NextRequest, NextResponse } from "next/server";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || "";

// Max 4MB — prevents accidental 30s+ recordings from hitting Deepgram
const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

function normalizeContentType(raw: string): string {
  const base    = raw.split(";")[0].trim().toLowerCase();
  const allowed = ["audio/webm","audio/ogg","audio/wav","audio/mp3","audio/flac","audio/mp4","audio/mpeg"];
  return allowed.includes(base) ? base : "audio/webm";
}

async function tryTranscribe(audioBuffer: ArrayBuffer, contentType: string, language: string) {
  const url = `https://api.deepgram.com/v1/listen?model=nova-2&language=${language}&smart_format=true&punctuate=true`;
  return fetch(url, {
    method: "POST",
    headers: { Authorization:`Token ${DEEPGRAM_API_KEY}`, "Content-Type":contentType },
    body: audioBuffer,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json({ error:"DEEPGRAM_API_KEY not configured" }, { status:500 });
    }

    const formData = await req.formData();
    const audio    = formData.get("audio") as Blob | null;
    const language = (formData.get("language") as string) || "hi";

    if (!audio) return NextResponse.json({ error:"No audio provided" }, { status:400 });

    const audioBuffer = await audio.arrayBuffer();

    if (audioBuffer.byteLength < 500) {
      return NextResponse.json({ error:"Recording too short — speak for at least 2 seconds" }, { status:400 });
    }

    // Cap size — frontend has 30s limit but just in case
    if (audioBuffer.byteLength > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error:"Recording too long — please keep it under 30 seconds" }, { status:400 });
    }

    const contentType = normalizeContentType(audio.type || "audio/webm");

    // Try original type → wav → ogg (with small delay between retries to avoid rate limit)
    let dgRes = await tryTranscribe(audioBuffer, contentType, language);

    if (dgRes.status === 400 && contentType !== "audio/wav") {
      await new Promise((r) => setTimeout(r, 300)); // small backoff
      dgRes = await tryTranscribe(audioBuffer, "audio/wav", language);
    }

    if (dgRes.status === 400) {
      await new Promise((r) => setTimeout(r, 300));
      dgRes = await tryTranscribe(audioBuffer, "audio/ogg", language);
    }

    if (!dgRes.ok) {
      const err = await dgRes.text();
      return NextResponse.json(
        { error:`Transcription failed (${dgRes.status}). Please try again.`, detail:err.slice(0,100) },
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