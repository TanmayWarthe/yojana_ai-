/**
 * scripts/build-ml-index.ts
 * Run once: npx ts-node --project tsconfig.json scripts/build-ml-index.ts
 * Output: data/ml-index.json
 */

import { pipeline } from "@xenova/transformers";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SCHEMES_PATH = join(process.cwd(), "public/schemes.json");
const OUTPUT_PATH  = join(process.cwd(), "data/ml-index.json");
const MODEL_NAME   = "Xenova/multilingual-e5-small"; // 118MB, supports Hindi/English/Tamil/Telugu/Marathi

type SchemeRaw = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  ministry?: string;
  state?: string;
  tags?: string[];
  eligibility_criteria?: string[];
  benefits?: string[];
  url_status?: string;
};

function buildSchemeText(s: SchemeRaw): string {
  // Combine all meaningful text fields into one string for embedding
  const parts = [
    s.name || "",
    s.description || "",
    s.category || "",
    s.ministry || "",
    s.state !== "Central" ? `${s.state} state scheme` : "central government scheme",
    (s.tags || []).join(" "),
    (s.eligibility_criteria || []).slice(0, 3).join(". "),
    (s.benefits || []).slice(0, 2).join(". "),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase().trim();
}

async function main() {
  console.log("🔧 Loading schemes.json...");
  const raw    = readFileSync(SCHEMES_PATH, "utf-8");
  const db     = JSON.parse(raw);
  const schemes: SchemeRaw[] = db.schemes || [];
  console.log(`   Found ${schemes.length} schemes`);

  console.log("\n🤖 Loading embedding model (first run downloads ~118MB)...");
  const embedder = await pipeline("feature-extraction", MODEL_NAME, {
    quantized: true, // smaller + faster
  });

  console.log("\n⚙️  Building embeddings...");
  const index: { id: string; vector: number[]; url_status: string }[] = [];

  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i];
    const text = buildSchemeText(s);

    const output = await embedder(text, { pooling: "mean", normalize: true });
    const vector = Array.from(output.data as Float32Array);

    index.push({
      id:         s.id,
      vector,
      url_status: s.url_status || "unknown",
    });

    if ((i + 1) % 25 === 0) {
      console.log(`   ${i + 1}/${schemes.length} done...`);
    }
  }

  mkdirSync(join(process.cwd(), "data"), { recursive: true });

  const output = {
    model:       MODEL_NAME,
    dimensions:  index[0]?.vector.length || 384,
    built_at:    new Date().toISOString(),
    total:       index.length,
    entries:     index,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output));
  console.log(`\n✅ ML index saved to data/ml-index.json`);
  console.log(`   ${index.length} scheme vectors · ${index[0]?.vector.length} dimensions each`);
}

main().catch((e) => { console.error(e); process.exit(1); });
