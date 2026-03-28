/**
 * app/api/profile/route.ts
 * GET  — fetch saved profile
 * POST — save / update profile
 * DELETE — clear profile
 */

import { NextRequest, NextResponse } from "next/server";
import { getProfile, saveProfile, deleteProfile } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/profile
export async function GET() {
  try {
    const profile = getProfile();
    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }
    return NextResponse.json({ profile }, { status: 200 });
  } catch (err) {
    console.error("[profile GET]", err);
    return NextResponse.json({ error: "Failed to read profile" }, { status: 500 });
  }
}

// POST /api/profile
export async function POST(req: NextRequest) {
  try {
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
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[profile POST]", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

// DELETE /api/profile
export async function DELETE() {
  try {
    deleteProfile();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[profile DELETE]", err);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
