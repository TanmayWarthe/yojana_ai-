import type { Scheme, MatchedScheme, CitizenProfile } from "@/types";

export function eligibilityEngine(profile: CitizenProfile, schemes: Scheme[]): MatchedScheme[] {
  const results: MatchedScheme[] = [];

  for (const s of schemes) {
    const tags = (s.eligibility_tags || {}) as Record<string, unknown>;
    const criteria = (s.eligibility_criteria || []).join(" ").toLowerCase();
    let score = 0;
    const reasons: string[] = [];

    const age = profile.age || 30;
    const income = profile.income || 0;

    if (tags.age_min && age < (tags.age_min as number)) continue;
    if (tags.age_max && age > (tags.age_max as number)) continue;
    if (tags.income_max != null && income > (tags.income_max as number)) continue;

    const occTags = ((tags.occupation as string[]) || []).map((o) => o.toLowerCase());
    const pOcc = (profile.occupation || "").toLowerCase();
    if (occTags.length && occTags.some((t) => pOcc.includes(t) || t.includes(pOcc))) {
      score += 30; reasons.push("Occupation matches");
    }
    if (tags.income_max != null) { score += 20; reasons.push("Income within limit"); }

    const gTags = ((tags.gender as string[]) || []).map((g) => g.toLowerCase());
    if (gTags.length && gTags.includes(profile.gender?.toLowerCase())) {
      score += 15; reasons.push("Gender eligible");
    }
    if (tags.bpl && profile.bpl) { score += 25; reasons.push("BPL priority"); }

    const kwMap: Record<string, string[]> = {
      farmer:   ["farmer","kisan","agriculture","crop","agri"],
      student:  ["student","scholarship","education","school","college"],
      woman:    ["woman","women","girl","mahila","maternity"],
      sc:       ["sc","scheduled caste","dalit"],
      st:       ["st","scheduled tribe","tribal"],
      obc:      ["obc","backward"],
      elderly:  ["elderly","senior","vridha","old age","pension"],
      business: ["entrepreneur","business","mudra","msme","startup"],
    };

    const pCat = (profile.category || "").toLowerCase();
    for (const [kw, words] of Object.entries(kwMap)) {
      if (words.some((w) => pOcc.includes(w) || pCat.includes(w) || kw === pOcc || kw === pCat)) {
        if (words.some((w) => criteria.includes(w))) {
          score += 10; reasons.push(`${kw} profile match`); break;
        }
      }
    }

    const sState = s.state || "Central";
    if (sState === "Central" || sState.toLowerCase() === (profile.state || "").toLowerCase()) {
      score += 5;
    }

    if (!Object.keys(tags).length && score === 0) {
      score = 5; reasons.push("Universal scheme");
    }

    if (score > 0) {
      const confidence = Math.min(98, Math.floor(30 + (score / 100) * 68));
      results.push({ scheme: s, score, confidence, reasons });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function searchSchemes(schemes: Scheme[], query: string, category = "All"): Scheme[] {
  const q = query.toLowerCase().trim();
  return schemes.filter((s) => {
    if (category !== "All" && s.category !== category) return false;
    if (!q) return true;
    const text = [s.name, s.description, ...(s.tags || []), s.category].join(" ").toLowerCase();
    return text.includes(q) || q.split(" ").some((w) => text.includes(w));
  });
}

export function lifeEventMatch(keywords: string[], schemes: Scheme[]): MatchedScheme[] {
  const results: MatchedScheme[] = [];
  for (const s of schemes) {
    const text = [
      s.name, s.description,
      ...(s.tags || []),
      ...(s.eligibility_criteria || []),
    ].join(" ").toLowerCase();
    const sc = keywords.filter((kw) => text.includes(kw)).length;
    if (sc > 0) {
      results.push({
        scheme: s,
        score: sc * 10,
        confidence: Math.min(85, 40 + sc * 15),
        reasons: ["Matches life event"],
      });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso?.slice(0, 10) || ""; }
}
