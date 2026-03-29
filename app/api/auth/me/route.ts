import { NextRequest, NextResponse } from "next/server";
import db, { UserRow } from "@/lib/db";

// Helper to get authenticated user
export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("yojana_uid")?.value;
    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const stmt = db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ? LIMIT 1`);
    const user = stmt.get(userId) as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    }, { status: 200 });
  } catch (err) {
    console.error("[auth/me GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
