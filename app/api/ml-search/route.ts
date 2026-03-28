/**
 * app/api/ml-search/route.ts
 * POST — receives { profile, query?, schemes? } → returns MatchedScheme[]
 *
 * Two modes:
 *   1. Client passes schemes array  → use those (fast, no extra fetch)
 *   2. Client passes nothing        → route fetches schemes.json itself
 */

import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { mlSearch } from "@/lib/ml-engine";
import type { CitizenProfile, Scheme } from "@/types";

function loadSchemes(): Scheme[] {
  try {
    const raw = readFileSync(join(process.cwd(), "public/schemes.json"), "utf-8");
    return JSON.parse(raw).schemes || [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const profile: CitizenProfile = body.profile;
    const query:   string         = body.query   || "";
    const schemes: Scheme[]       = body.schemes?.length
      ? body.schemes
      : loadSchemes();

    if (!profile) {
      return NextResponse.json(
        { error: "profile is required" },
        { status: 400 }
      );
    }

    if (schemes.length === 0) {
      return NextResponse.json(
        { error: "No schemes available — check public/schemes.json" },
        { status: 500 }
      );
    }

    const results = await mlSearch(query, profile, schemes);

    return NextResponse.json({
      results,
      total:   results.length,
      mode:    "ml-semantic",
      query:   query || "(profile only)",
    });

  } catch (err) {
    console.error("ml-search error:", err);

    // If ML index missing → tell client to fall back to rule-based engine
    const message = err instanceof Error ? err.message : "Unknown error";
    const isMissingIndex = message.includes("ml-index.json") || message.includes("ENOENT");

    return NextResponse.json(
      {
        error:    isMissingIndex ? "ML index not built yet" : "ML search failed",
        fallback: isMissingIndex, // client checks this flag
        detail:   message,
      },
      { status: isMissingIndex ? 503 : 500 }
    );
  }
}
