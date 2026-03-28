/**
 * lib/ml-engine.ts
 * Semantic search engine using pre-computed embeddings + profile hard filters + URL health scoring.
 * Replaces the rule-based eligibilityEngine() with actual ML understanding.
 *
 * Final score formula:
 *   final_score = semantic_similarity × url_health_weight × profile_hard_filter
 */

import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import { readFileSync } from "fs";
import { join } from "path";
import type { Scheme, MatchedScheme, CitizenProfile } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type MLIndexEntry = {
  id:         string;
  vector:     number[];
  url_status: string;
};

type MLIndex = {
  model:      string;
  dimensions: number;
  built_at:   string;
  total:      number;
  entries:    MLIndexEntry[];
};

// ─── URL Health Weights (your original idea) ─────────────────────────────────

const URL_HEALTH_WEIGHT: Record<string, number> = {
  live:       1.0,  // HTTP 200 — apply link works, citizen can apply
  blocked:    0.6,  // HTTP 403 — site exists but programmatic access blocked
  ssl_error:  0.5,  // SSL expired — site is real but certificate wrong
  redirected: 0.8,  // Moved but functional
  unknown:    0.7,  // No check done yet — give benefit of doubt
  dead:       0.2,  // HTTP 404 — link outdated, scheme may be discontinued
};

// ─── Profile Hard Filters ────────────────────────────────────────────────────
// Returns 0 if the scheme definitely excludes this profile, 1 otherwise.

function profileHardFilter(scheme: Scheme, profile: CitizenProfile): 0 | 1 {
  const tags = (scheme.eligibility_tags || {}) as Record<string, unknown>;
  const age    = profile.age    || 30;
  const income = profile.income || 0;

  if (tags.age_min != null && age < (tags.age_min as number)) return 0;
  if (tags.age_max != null && age > (tags.age_max as number)) return 0;
  if (tags.income_max != null && income > (tags.income_max as number)) return 0;

  // State filter: central schemes pass everyone; state schemes only match their state
  const schemeState = scheme.state || "Central";
  if (
    schemeState !== "Central" &&
    schemeState.toLowerCase() !== (profile.state || "").toLowerCase()
  ) {
    return 0;
  }

  // Gender filter
  const gTags = ((tags.gender as string[]) || []).map((g: string) => g.toLowerCase());
  if (gTags.length > 0 && !gTags.includes(profile.gender?.toLowerCase())) return 0;

  return 1;
}

// ─── Reason Generation ───────────────────────────────────────────────────────
// Generates human-readable reasons why a scheme matched (shown in SchemeCard)

function generateReasons(
  scheme: Scheme,
  profile: CitizenProfile,
  similarity: number
): string[] {
  const reasons: string[] = [];
  const tags     = (scheme.eligibility_tags || {}) as Record<string, unknown>;
  const criteria = (scheme.eligibility_criteria || []).join(" ").toLowerCase();
  const pOcc     = (profile.occupation || "").toLowerCase();
  const pCat     = (profile.category   || "").toLowerCase();

  if (similarity >= 0.75) reasons.push("Strong semantic match");
  else if (similarity >= 0.55) reasons.push("Good keyword match");

  const occWords = ["farmer","kisan","student","woman","worker","business","artisan","fisherman","driver"];
  for (const w of occWords) {
    if (pOcc.includes(w) && criteria.includes(w)) {
      reasons.push("Occupation matches"); break;
    }
  }

  if (tags.income_max != null) reasons.push("Income within limit");
  if (tags.bpl && profile.bpl)  reasons.push("BPL priority scheme");

  // Enhanced category matching
  if (pCat === "sc" && (criteria.includes("scheduled caste") || criteria.includes("sc"))) {
    reasons.push("SC category benefit");
  } else if (pCat === "st" && (criteria.includes("scheduled tribe") || criteria.includes("tribal") || criteria.includes("st"))) {
    reasons.push("ST category benefit");
  } else if (pCat === "obc" && (criteria.includes("obc") || criteria.includes("backward"))) {
    reasons.push("OBC category benefit");
  } else if (pCat === "minority" && criteria.includes("minority")) {
    reasons.push("Minority category benefit");
  } else if (pCat === "ews" && (criteria.includes("ews") || criteria.includes("economically weaker"))) {
    reasons.push("EWS category benefit");
  }

  // Additional profile attributes
  if (profile.bpl && (criteria.includes("bpl") || criteria.includes("below poverty"))) {
    reasons.push("BPL eligible");
  }
  if (profile.has_land && (criteria.includes("land") || criteria.includes("farmer") || criteria.includes("kisan"))) {
    reasons.push("Farmer/Land owner benefit");
  }
  if (profile.disabled && (criteria.includes("disab") || criteria.includes("handicap") || criteria.includes("divyang"))) {
    reasons.push("Disability benefit");
  }

  if (scheme.state !== "Central" && scheme.state === profile.state) {
    reasons.push(`${profile.state} state scheme`);
  }

  return reasons.slice(0, 3); // SchemeCard shows max 3
}

// ─── Cosine Similarity ───────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ─── Singleton Embedder ───────────────────────────────────────────────────────
// Load model once, reuse across requests (Next.js keeps module in memory)

let embedderInstance: FeatureExtractionPipeline | null = null;

async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (!embedderInstance) {
    embedderInstance = await pipeline(
      "feature-extraction",
      "Xenova/multilingual-e5-small",
      { quantized: true }
    );
  }
  return embedderInstance;
}

// ─── ML Index Loader ─────────────────────────────────────────────────────────
// Cached in module scope — reads file once per server process

let mlIndexCache: MLIndex | null = null;

function getMLIndex(): MLIndex {
  if (mlIndexCache) return mlIndexCache;

  const indexPath = join(process.cwd(), "data/ml-index.json");
  const raw       = readFileSync(indexPath, "utf-8");
  mlIndexCache    = JSON.parse(raw) as MLIndex;
  return mlIndexCache;
}

// ─── Build Query Text (mirrors build-ml-index.ts logic) ──────────────────────

function buildQueryText(query: string, profile: CitizenProfile): string {
  const parts = [
    query,
    profile.occupation  || "",
    profile.category    || "",
    profile.state       || "",
    profile.bpl         ? "bpl below poverty line" : "",
    profile.disabled    ? "disability handicapped" : "",
    profile.has_land    ? "farmer agriculture land" : "",
    profile.gender === "Female" ? "women mahila" : "",
    profile.age < 25    ? "youth student" : "",
    profile.age > 60    ? "senior citizen elderly" : "",
    profile.income < 150000 ? "low income poor" : "",
  ];
  return parts.filter(Boolean).join(" ").toLowerCase().trim();
}

// ─── Main Export: mlSearch ────────────────────────────────────────────────────

export async function mlSearch(
  query: string,
  profile: CitizenProfile,
  schemes: Scheme[],
  topK = 30
): Promise<MatchedScheme[]> {

  // 1. Build query embedding
  const embedder  = await getEmbedder();
  const queryText = buildQueryText(query, profile);
  const qOutput   = await embedder(queryText, { pooling: "mean", normalize: true });
  const qVector   = Array.from(qOutput.data as Float32Array);

  // 2. Load pre-computed scheme vectors
  const mlIndex   = getMLIndex();
  const entryMap  = new Map(mlIndex.entries.map((e) => [e.id, e]));

  // 3. Score every scheme
  const scored: MatchedScheme[] = [];

  for (const scheme of schemes) {
    // Hard filter first — fastest elimination
    if (profileHardFilter(scheme, profile) === 0) continue;

    const entry = entryMap.get(scheme.id);
    if (!entry) continue; // Scheme added after index was built — skip

    const similarity = cosineSimilarity(qVector, entry.vector);
    const urlWeight = URL_HEALTH_WEIGHT[entry.url_status] ?? 0.7;

    // Profile bonus — explicit boosts for strong demographic matches
    let profileBonus = 0;
    const tags = (scheme.eligibility_tags || {}) as Record<string, unknown>;
    const criteria = (scheme.eligibility_criteria || []).join(" ").toLowerCase();
    const schemeTags = (scheme.tags || []).join(" ").toLowerCase();
    const pOcc = (profile.occupation || "").toLowerCase();
    const pCat = (profile.category || "").toLowerCase();
    const fullText = criteria + " " + schemeTags;

    // Occupation match — strongest signal
    if ((pOcc.includes("farm") || pOcc.includes("kisan")) &&
        (fullText.includes("farm") || fullText.includes("kisan") ||
         fullText.includes("crop") || fullText.includes("agri"))) {
      profileBonus += 0.20;
    }
    if (pOcc.includes("student") &&
        (fullText.includes("student") || fullText.includes("scholar") ||
         fullText.includes("education"))) {
      profileBonus += 0.20;
    }
    if ((pOcc.includes("worker") || pOcc.includes("labour")) &&
        (fullText.includes("worker") || fullText.includes("labour") ||
         fullText.includes("rozgar"))) {
      profileBonus += 0.18;
    }
    if ((pOcc.includes("business") || pOcc.includes("entrepreneur")) &&
        (fullText.includes("mudra") || fullText.includes("msme") ||
         fullText.includes("startup") || fullText.includes("loan"))) {
      profileBonus += 0.18;
    }

    // Social category — high weight
    if (pCat === "sc" && (fullText.includes("scheduled caste") ||
        fullText.includes("dalit") || fullText.includes("sc/st") ||
        fullText.includes(" sc "))) profileBonus += 0.18;
    if (pCat === "st" && (fullText.includes("scheduled tribe") ||
        fullText.includes("tribal") || fullText.includes("adivasi") ||
        fullText.includes("sc/st"))) profileBonus += 0.18;
    if (pCat === "obc" && (fullText.includes("obc") ||
        fullText.includes("backward class"))) profileBonus += 0.15;
    if (pCat === "ews" && (fullText.includes("ews") ||
        fullText.includes("economically weaker"))) profileBonus += 0.15;
    if (pCat === "minority" && (fullText.includes("minority") ||
        fullText.includes("muslim") || fullText.includes("waqf"))) profileBonus += 0.15;

    // BPL — very strong signal
    if (profile.bpl && (fullText.includes("bpl") ||
        fullText.includes("below poverty") ||
        fullText.includes("ration card"))) profileBonus += 0.20;

    // Land ownership
    if (profile.has_land && (fullText.includes("land") ||
        fullText.includes("farmer") || fullText.includes("kisan") ||
        fullText.includes("cultivat"))) profileBonus += 0.12;

    // Gender
    if (profile.gender === "Female" && (fullText.includes("women") ||
        fullText.includes("mahila") || fullText.includes("girl") ||
        fullText.includes("maternity"))) profileBonus += 0.18;

    // Disability
    if (profile.disabled && (fullText.includes("disab") ||
        fullText.includes("divyang") || fullText.includes("handicap"))) {
      profileBonus += 0.20;
    }

    // Age-specific
    if (profile.age > 60 && (fullText.includes("senior") ||
        fullText.includes("pension") || fullText.includes("elderly") ||
        fullText.includes("old age"))) profileBonus += 0.18;
    if (profile.age < 25 && (fullText.includes("youth") ||
        fullText.includes("young") || fullText.includes("student"))) {
      profileBonus += 0.15;
    }

    // Income-specific
    if (profile.income < 100000 && (fullText.includes("low income") ||
        fullText.includes("poor") || fullText.includes("weaker section"))) {
      profileBonus += 0.12;
    }

    // State-specific schemes get big boost
    const schemeState = scheme.state || "Central";
    if (schemeState !== "Central" &&
        schemeState.toLowerCase() === (profile.state || "").toLowerCase()) {
      profileBonus += 0.25;
    }

    // Final score
    const rawScore = Math.min(1.0, (similarity * 0.5) + (profileBonus * 0.5)) * urlWeight;

    // Skip very weak matches
    if (rawScore < 0.18) continue;

    // Spread across 30-98% — wider range now
    const spread = Math.max(0, Math.min(1, (rawScore - 0.18) / (0.82 - 0.18)));
    const confidence = Math.min(98, Math.max(30, Math.floor(30 + spread * 68)));

    scored.push({
      scheme,
      score: Math.round(rawScore * 1000),
      confidence,
      reasons: generateReasons(scheme, profile, similarity),
    });
  }

  // 4. Sort by score descending, return topK
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── Fallback: profile-only search (no query text) ───────────────────────────
// Used when user submits Find form without typing a search query

export async function mlSearchByProfile(
  profile: CitizenProfile,
  schemes: Scheme[],
  topK = 30
): Promise<MatchedScheme[]> {
  return mlSearch("", profile, schemes, topK);
}
