import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../helpers/requireRole";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(["org:admin", "org:member"]);
    if (authResult.error) return authResult.error;
    // 1. Get the status from the URL query params
    const statusParam = req.nextUrl.searchParams.get("status");

    // 2. Start building the query WITHOUT the status filter yet~
    let query = supabase
      .from("transactions")
      .select("*, transaction_add_ons(*), services(*)")
      .order("vehicle_in", { ascending: false }); // usually admin pages want newest first

    // 3. If a status was passed, apply the filter dynamically
    if (statusParam) {
      // split "pending,in_progress" -> ["pending", "in_progress"]
      const statusArray = statusParam.split(",");
      query = query.in("status", statusArray);
    }

    // 4. Execute the query
    const { data, error } = await query;

    if (error) {
      console.log("Fetch Transactions Error:", error.message);
      return NextResponse.json(
        { message: "Failed to fetch transactions", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Internal Server Error", error: message },
      { status: 500 },
    );
  }
}
