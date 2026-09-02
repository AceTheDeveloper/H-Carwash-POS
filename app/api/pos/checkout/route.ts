import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import handleOrderId from "../../helpers/handle_order_id";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const order_id = await handleOrderId();

  const transactionData = {
    order_id: order_id,
    customer_name: body.customer_name,
    contact_number: body.contact_number,
    plate_number: body.plate_number,
    vehicle_classification: body.vehicle_classification,
    vehicle_size: body.vehicle_size,
    total_price: body.total_price,
  };

  try {
    const { error } = await supabase
      .from("transactions")
      .insert(transactionData);

    if (error) {
      console.log(error.message);
      return NextResponse.json(
        { message: "Failed to insert transaction", error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Transaction inserted successfully" },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to insert transaction" },
      { status: 500 },
    );
  }
}
