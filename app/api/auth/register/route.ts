import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const user = createUser(name, email, phone, password);
      
      const res = NextResponse.json({ success: true, message: "User created" }, { status: 201 });
      
      // Keep the user logged in using the existing yojana_uid cookie system
      res.cookies.set("yojana_uid", user.id, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
      });

      return res;
    } catch (err: any) {
      if (err.message === "Email already registered") {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw err;
    }

  } catch (err) {
    console.error("[register POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
