/**
 * app/api/profile/route.ts
 * GET  — fetch saved profile (per-user via cookie)
 * POST — save / update profile (per-user via cookie)
 * DELETE — clear profile (per-user via cookie)
 *
 * Users are identified by a `yojana_uid` cookie (UUID).
 * If no cookie exists, one is generated and set automatically.
 */

import { NextRequest, NextResponse } from "next/server";
import { getProfile, saveProfile, deleteProfile } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/** Read or create the yojana_uid from cookies */
function getUserId(req: NextRequest): { userId: string; isNew: boolean } {
  const existing = req.cookies.get("yojana_uid")?.value;
  if (existing && existing.length >= 8) {
    return { userId: existing, isNew: false };
  }
  return { userId: randomUUID(), isNew: true };
}

/** Attach set-cookie header when we create a new UID */
function withCookie(res: NextResponse, userId: string, isNew: boolean): NextResponse {
  if (isNew) {
    res.cookies.set("yojana_uid", userId, {
      path: "/",
      httpOnly: false,       // needs to be readable by client for localStorage key
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
    });
  }
  return res;
}

// GET /api/profile
export async function GET(req: NextRequest) {
  try {
    const { userId, isNew } = getUserId(req);
    const profile = getProfile(userId);
    const res = NextResponse.json(
      { profile: profile || null, userId },
      { status: 200 }
    );
    return withCookie(res, userId, isNew);
  } catch (err) {
    console.error("[profile GET]", err);
    return NextResponse.json({ error: "Failed to read profile" }, { status: 500 });
  }
}

// POST /api/profile
export async function POST(req: NextRequest) {
  try {
    const { userId, isNew } = getUserId(req);
    const body = await req.json();

    // Basic validation of required fields
    const required = ["name", "age", "gender", "state", "occupation", "income", "category"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === "") {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    saveProfile({
      name:               String(body.name).trim(),
      age:                Number(body.age),
      gender:             String(body.gender),
      state:              String(body.state),
      occupation:         String(body.occupation),
      income:             Number(body.income),
      category:           String(body.category),
      bpl:                Boolean(body.bpl),
      has_land:           Boolean(body.has_land),
      disabled:           Boolean(body.disabled),
      marital_status:     body.marital_status || "Single",
      children_count:     Number(body.children_count) || 0,
      education:          body.education || "Secondary",
      farmer_type:        body.farmer_type || "",
      annual_ration_card: Boolean(body.annual_ration_card),
      is_student:         Boolean(body.is_student),
      is_senior:          Boolean(body.is_senior),
      details:            body.details || {},
    }, userId);

    const res = NextResponse.json({ success: true, userId }, { status: 200 });
    return withCookie(res, userId, isNew);
  } catch (err) {
    console.error("[profile POST]", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

// DELETE /api/profile
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getUserId(req);
    deleteProfile(userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[profile DELETE]", err);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
