import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../helpers/requireRole";

// GET /api/promos/lookup?code=XXXXXXXX
// Used by the POS QR scanner: turns a scanned code into a promo the
// cashier can apply, without the cashier needing to browse the list.
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(["org:admin", "org:member"]);
    if (authResult.error) return authResult.error;

    const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ message: "Missing code" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("promos")
      .select(
        "*, reward_add_on:add_ons(id, label, price, created_at, updated_at)",
      )
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.log("ERROR : ", error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: "No promo found for this QR code" },
        { status: 404 },
      );
    }

    if (!data.is_active) {
      return NextResponse.json(
        { message: `"${data.name}" is not currently active` },
        { status: 409 },
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
