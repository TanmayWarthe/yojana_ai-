import { readFileSync } from "fs";
import { join } from "path";
import HomeClient from "./HomeClient";
import type { SchemesDB } from "@/types";

export default function HomePage() {
  let db: SchemesDB = { meta: { total_schemes: 0, last_updated: "", next_update: "", scrape_interval_hours: 6, categories: {}, data_quality: {} }, schemes: [] };
  try {
    const dbPath = process.env.SCHEMES_DB_PATH || "public/schemes.json";
    const raw = readFileSync(join(process.cwd(), dbPath), "utf-8");
    db = JSON.parse(raw);
  } catch {}
  return <HomeClient db={db} />;
}
