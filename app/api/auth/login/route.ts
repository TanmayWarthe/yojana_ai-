import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = authenticateUser(email, password);
    
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    
    const res = NextResponse.json({ success: true, message: "Logged in successfully", name: user.name }, { status: 200 });
    
    // Resume session with the user's permanent ID instead of anonymous UUID
    res.cookies.set("yojana_uid", user.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
    });

    return res;

  } catch (err) {
    console.error("[login POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
