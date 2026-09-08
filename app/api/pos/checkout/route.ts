import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import handleOrderId from "../../helpers/handle_order_id";
import { requireRole } from "../../helpers/requireRole";

interface CheckoutAddOn {
  id: string;
  price: number;
  seller_id?: string | null;
}

interface CheckoutBody {
  customer_name: string;
  contact_number?: string;
  plate_number: string;
  vehicle_classification: string;
  vehicle_size: string;
  service_id: string;
  service_price: number;
  add_ons?: CheckoutAddOn[];
  promo?: unknown;
  payment_method: string;
  staff?: string[];
  total_price: number;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(["org:admin", "org:member"]);
    if (authResult.error) return authResult.error;
    const body = (await req.json()) as CheckoutBody;

    if (
      !body.customer_name?.trim() ||
      !body.plate_number?.trim() ||
      !body.service_id ||
      !body.payment_method ||
      !Array.isArray(body.staff) ||
      body.staff.length === 0
    ) {
      return NextResponse.json(
        { message: "Missing required checkout fields" },
        { status: 400 },
      );
    }

    const order_id = await handleOrderId();

    // 1. Prepare data for the main transactions table
    const transactionData = {
      order_id: order_id,
      customer_name: body.customer_name,
      contact_number: body.contact_number,
      plate_number: body.plate_number,
      vehicle_classification: body.vehicle_classification,
      vehicle_size: body.vehicle_size,
      service_id: body.service_id,
      service_price: body.service_price, // Snapshot of the service price
      payment_method: body.payment_method,
      status: "pending",
      promo: body.promo,
      vehicle_in: new Date().toISOString(),
      vehicle_out: null,
      total_price: body.total_price,
    };

    // Insert transaction and select the generated 'id' so we can link add-ons
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select("id")
      .single();

    if (transactionError || !transaction) {
      console.log("Transaction Insert Error:", transactionError?.message);
      return NextResponse.json(
        {
          message: "Failed to insert transaction",
          error: transactionError?.message,
        },
        { status: 500 },
      );
    }

    // 2. Prepare and insert the add-ons (if any exist)
    if (Array.isArray(body.add_ons) && body.add_ons.length > 0) {
      const addOnsData = body.add_ons.map((addon) => ({
        transaction_id: transaction.id,
        add_on_id: addon.id,
        price: Number(addon.price) || 0,
        seller_id: addon.seller_id || null,
      }));

      const { error: addOnsError } = await supabase
        .from("transaction_add_ons")
        .insert(addOnsData);

      if (addOnsError) {
        console.log("Add-ons Insert Error:", addOnsError.message);
        return NextResponse.json(
          {
            message: "Transaction created, but failed to insert add-ons",
            error: addOnsError.message,
          },
          { status: 500 },
        );
      }
    }

    // 3. Prepare and insert the assigned staff (if any exist)
    if (Array.isArray(body.staff) && body.staff.length > 0) {
      const staffData = body.staff.map((staffId) => ({
        transaction_id: transaction.id,
        staff_id: staffId,
        // commission_amount + commission_rate_used stay null until
        // the order is marked "completed" (calculated in the status route)
      }));

      const { error: staffError } = await supabase
        .from("transaction_staff")
        .insert(staffData);

      if (staffError) {
        console.log("Staff Assignment Insert Error:", staffError.message);
        return NextResponse.json(
          {
            message: "Transaction created, but failed to assign staff",
            error: staffError.message,
          },
          { status: 500 },
        );
      }
    }

    // 4. Success
    return NextResponse.json(
      { message: "Transaction, add-ons, and staff inserted successfully" },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: message },
      { status: 500 },
    );
  }
}
