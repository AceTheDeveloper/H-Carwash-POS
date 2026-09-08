import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../helpers/requireRole";

interface RecentCommissionRow {
  id: string;
  commission_amount: number | null;
  created_at: string;
  staffs?: { name?: string } | { name?: string }[] | null;
  transaction?: {
    vehicle_out?: string | null;
    services?: { service_name?: string } | { service_name?: string }[] | null;
  } | null;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole("org:admin");
    if (authResult.error) return authResult.error;
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

    // Fixed: changed row.staff to row.staffs
    const recent = ((data as RecentCommissionRow[] | null) || []).map(
      (row) => ({
        id: row.id,
        date: row.transaction?.vehicle_out ?? row.created_at,
        staff_name: Array.isArray(row.staffs)
          ? (row.staffs[0]?.name ?? "Unknown")
          : (row.staffs?.name ?? "Unknown"),
        service_name: Array.isArray(row.transaction?.services)
          ? (row.transaction?.services[0]?.service_name ?? "Unknown")
          : (row.transaction?.services?.service_name ?? "Unknown"),
        amount: Number(row.commission_amount),
      }),
    );

    return NextResponse.json({ data: recent }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Internal Server Error", error: message },
      { status: 500 },
    );
  }
}
