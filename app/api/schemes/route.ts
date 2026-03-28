import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const revalidate = 60;

export async function GET() {
  try {
    const dbPath = process.env.SCHEMES_DB_PATH || "public/schemes.json";
    const filePath = join(process.cwd(), dbPath);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to load schemes:", err);
    return NextResponse.json({ schemes: [], meta: {} }, { status: 500 });
  }
}
