import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const COMMISSION_RATE = 0.25; // flat 25% for now

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    const allowedStatuses = [
      "pending",
      "in_progress",
      "completed",
      "cancelled",
    ];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, any> = { status };

    if (status === "completed") {
      updateData.vehicle_out = new Date().toISOString();
    }

    // 1. Update the transaction itself
    const { data: transaction, error: updateError } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", id)
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
        const commissionPool =
          Number(transaction.total_price) * COMMISSION_RATE;
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
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}
