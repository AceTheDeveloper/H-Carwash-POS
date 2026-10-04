import { getSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../helpers/requireRole";

const SETTLE_METHODS = ["cash", "qr", "card"];

// Settles an unpaid order (e.g. a partner finally paid): records how it was paid.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole("org:admin");
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const { payment_method } = await req.json();

    if (!SETTLE_METHODS.includes(payment_method)) {
      return NextResponse.json(
        { message: "Choose how it was paid: cash, qr or card" },
        { status: 400 },
      );
    }

    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("transactions")
      .update({ payment_method, paid_at: new Date().toISOString() })
      .eq("id", id)
      .eq("payment_method", "unpaid")
      .select()
      .maybeSingle();

    if (error) {
      console.log("Settle Unpaid Error:", error.message);
      return NextResponse.json(
        { message: "Failed to settle order", error: error.message },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json(
        { message: "Order not found or it is not unpaid" },
        { status: 409 },
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Internal Server Error", error: message },
      { status: 500 },
    );
  }
}
