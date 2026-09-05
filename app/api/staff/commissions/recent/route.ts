import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 20;

    const { data, error } = await supabase
      .from("transaction_staff")
      .select(
        `
        id,
        commission_amount,
        commission_rate_used,
        created_at,
        staffs:staff_id ( id, name ),
        transaction:transaction_id (
          id,
          vehicle_out,
          service_id,
          services ( service_name )
        )
      `,
      )
      .not("commission_amount", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.log("Fetch Recent Commissions Error:", error.message);
      return NextResponse.json(
        { message: "Failed to fetch recent commissions", error: error.message },
        { status: 500 },
      );
    }

    // Flatten the nested joins into a clean shape for the frontend table
    const recent = (data || []).map((row: any) => ({
      id: row.id,
      date: row.transaction?.vehicle_out ?? row.created_at,
      staff_name: row.staff?.name ?? "Unknown",
      service_name: row.transaction?.services?.service_name ?? "Unknown",
      amount: Number(row.commission_amount),
    }));

    return NextResponse.json({ data: recent }, { status: 200 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}
