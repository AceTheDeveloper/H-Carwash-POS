import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../helpers/requireRole";

const COMMISSION_RATE = 0.25; // flat 25% for now

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    // Cancelling a transaction is admin-only; staff can still advance the queue.
    const authResult = await requireRole(
      status === "cancelled" ? "org:admin" : ["org:admin", "org:member"],
    );
    if (authResult.error) return authResult.error;

    const allowedStatuses = [
      "pending",
      "in_progress",
      "completed",
      "cancelled",
    ];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "completed") {
      updateData.vehicle_out = new Date().toISOString();
    }

    // 1. Update the transaction itself
    let updateQuery = supabase
      .from("transactions")
      .update(updateData)
      .eq("id", id);

    // Only unfinished orders can be cancelled (completed ones already paid out commissions).
    if (status === "cancelled") {
      updateQuery = updateQuery.in("status", ["pending", "in_progress"]);
    }

    const { data: transaction, error: updateError } = await updateQuery
      .select()
      .single();

    if (updateError || !transaction) {
      console.log("Update Status Error:", updateError?.message);
      return NextResponse.json(
        { message: "Failed to update status", error: updateError?.message },
        { status: 500 },
      );
    }

    // 2. If completed, calculate and store commission per assigned staff
    if (status === "completed") {
      const { data: staffRows, error: staffFetchError } = await supabase
        .from("transaction_staff")
        .select("id")
        .eq("transaction_id", id);

      if (staffFetchError) {
        console.log("Fetch Transaction Staff Error:", staffFetchError.message);
        return NextResponse.json(
          {
            message: "Status updated, but failed to fetch assigned staff",
            error: staffFetchError.message,
          },
          { status: 500 },
        );
      }

      if (staffRows && staffRows.length > 0) {
        // Commission is based on the ORIGINAL price (service + add-ons as listed),
        // not the discounted total, so a promo / free wash never costs the staff
        // their commission.
        const { data: addOnRows, error: addOnFetchError } = await supabase
          .from("transaction_add_ons")
          .select("price")
          .eq("transaction_id", id);

        if (addOnFetchError) {
          console.log("Fetch Add-ons Error:", addOnFetchError.message);
          return NextResponse.json(
            {
              message: "Status updated, but failed to calculate commissions",
              error: addOnFetchError.message,
            },
            { status: 500 },
          );
        }

        const originalPrice =
          Number(transaction.service_price || 0) +
          (addOnRows || []).reduce((sum, a) => sum + Number(a.price || 0), 0);
        const commissionBase =
          originalPrice > 0 ? originalPrice : Number(transaction.total_price);
        const commissionPool = commissionBase * COMMISSION_RATE;
        const perStaffAmount = commissionPool / staffRows.length;

        const { error: commissionError } = await supabase
          .from("transaction_staff")
          .update({
            commission_amount: perStaffAmount,
            commission_rate_used: COMMISSION_RATE,
          })
          .eq("transaction_id", id);

        if (commissionError) {
          console.log("Commission Update Error:", commissionError.message);
          return NextResponse.json(
            {
              message: "Status updated, but failed to calculate commissions",
              error: commissionError.message,
            },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ data: transaction }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Internal Server Error", error: message },
      { status: 500 },
    );
  }
}
