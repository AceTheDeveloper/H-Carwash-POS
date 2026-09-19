import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../helpers/requireRole";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(["org:admin", "org:member"]);
    if (authResult.error) return authResult.error;
    const { data, error } = await supabase
      .from("promos")
      .select(
        "*, reward_add_on:add_ons(id, label, price, created_at, updated_at)",
      )
      .order("name", { ascending: true });

    if (error) {
      console.log("ERROR : ", error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.log(
      "ERROR : ",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Short, human-typeable, unlikely-to-collide code for the QR payload.
function generatePromoCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole("org:admin");
    if (authResult.error) return authResult.error;
    const body = await req.json();

    // Retry a few times in the (very unlikely) event of a code collision.
    let lastError: { message: string; code?: string } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = body.code || generatePromoCode();
      const { error } = await supabase.from("promos").insert({ ...body, code });

      if (!error) {
        return NextResponse.json({ message: "Inserted" }, { status: 200 });
      }

      lastError = error;
      // 23505 = unique_violation. Only retry on that; anything else, bail.
      if (error.code !== "23505") break;
    }

    console.log("ERROR : ", lastError?.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  } catch (error) {
    console.log(
      "ERROR : ",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
