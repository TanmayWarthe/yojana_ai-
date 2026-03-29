import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out" }, { status: 200 });

  // Clear the cookie to start a fresh session
  res.cookies.set("yojana_uid", "", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 0, 
  });

  return res;
}
