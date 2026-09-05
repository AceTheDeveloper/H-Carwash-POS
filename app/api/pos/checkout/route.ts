import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import handleOrderId from "../../helpers/handle_order_id";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order_id = await handleOrderId();

    // 1. Prepare data for the main transactions table
    const transactionData = {
      order_id: order_id,
      customer_name: body.customer_name,
      contact_number: body.contact_number,
      plate_number: body.plate_number,
      vehicle_classification: body.vehicle_classification,
      vehicle_size: body.vehicle_size,
      service_id: body.service, // Maps to selectedService.id
      service_price: body.service_price, // Snapshot of the service price
      payment_method: body.paymentMethod,
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
    if (
      body.add_ons &&
      Array.isArray(body.add_ons) &&
      body.add_ons.length > 0
    ) {
      // Map the parallel arrays (add_ons and add_ons_price) from the frontend
      const addOnsData = body.add_ons.map((addonId: string, index: number) => ({
        transaction_id: transaction.id,
        add_on_id: addonId,
        price: body.add_ons_price[index] || 0, // Snapshot price of the specific add-on
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

    // 3. Success
    return NextResponse.json(
      { message: "Transaction and add-ons inserted successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}
