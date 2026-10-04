import { getSupabaseClient } from "@/lib/supabase-server";
import { getAppDate } from "@/lib/date";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../helpers/requireRole";

// Completed orders for one day (Manila time), with everything the daily sheet
// needs: services, add-ons, assigned staff. Used by the POS "Daily Sheet" viewer.
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(["org:admin", "org:member"]);
    if (authResult.error) return authResult.error;

    const dateParam = req.nextUrl.searchParams.get("date");
    const date =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? dateParam
        : getAppDate();

    const startIso = new Date(`${date}T00:00:00+08:00`).toISOString();
    const end = new Date(`${date}T00:00:00+08:00`);
    end.setDate(end.getDate() + 1);

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        order_id,
        customer_name,
        plate_number,
        service_price,
        total_price,
        payment_method,
        unpaid_note,
        paid_at,
        status,
        vehicle_in,
        services ( service_name ),
        transaction_add_ons ( add_on_id, price, seller_id ),
        transaction_staff ( staff_id, commission_amount, staffs ( id, name ) )
      `,
      )
      .gte("vehicle_in", startIso)
      .lt("vehicle_in", end.toISOString())
      .neq("status", "cancelled")
      .order("vehicle_in", { ascending: true });

    if (error) {
      console.log("Daily Sheet Error:", error.message);
      return NextResponse.json(
        { message: "Failed to load daily sheet", error: error.message },
        { status: 500 },
      );
    }

    const rows = data || [];
    return NextResponse.json({
      date,
      // Only completed orders are sales on the sheet; the rest are still in the queue.
      data: rows.filter((t) => t.status?.toLowerCase() === "completed"),
      openCount: rows.filter((t) => t.status?.toLowerCase() !== "completed")
        .length,
    });
  } catch (error) {
    console.error("API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Internal Server Error", error: message },
      { status: 500 },
    );
  }
}
