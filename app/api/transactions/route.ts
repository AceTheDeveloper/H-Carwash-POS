import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, transaction_add_ons(*)")
      .in("status", ["pending", "in_progress", "completed"])
      .order("vehicle_in", { ascending: true });

    if (error) {
      console.log("Fetch Pending Orders Error:", error.message);
      return NextResponse.json(
        { message: "Failed to fetch pending orders", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}
