import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all staff first, so staff with zero commissions still show up (₱0)
    const { data: staffList, error: staffError } = await supabase
      .from("staffs")
      .select("id, name");

    if (staffError) {
      console.log("Fetch Staff Error:", staffError.message);
      return NextResponse.json(
        { message: "Failed to fetch staff", error: staffError.message },
        { status: 500 },
      );
    }

    // Get all commission rows that have actually been calculated
    const { data: commissionRows, error: commissionError } = await supabase
      .from("transaction_staff")
      .select("staff_id, commission_amount")
      .not("commission_amount", "is", null);

    if (commissionError) {
      console.log("Fetch Commissions Error:", commissionError.message);
      return NextResponse.json(
        {
          message: "Failed to fetch commissions",
          error: commissionError.message,
        },
        { status: 500 },
      );
    }

    // Aggregate in JS: sum commission_amount per staff_id
    const totalsByStaffId = new Map<string, number>();
    for (const row of commissionRows || []) {
      const current = totalsByStaffId.get(row.staff_id) || 0;
      totalsByStaffId.set(
        row.staff_id,
        current + Number(row.commission_amount),
      );
    }

    const summary = (staffList || []).map((staff) => ({
      staff_id: staff.id,
      name: staff.name,
      total_earned: totalsByStaffId.get(staff.id) || 0,
    }));

    return NextResponse.json({ data: summary }, { status: 200 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}
