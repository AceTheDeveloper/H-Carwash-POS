import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.json();

  try {
    const { error } = await supabase.from("transactions").insert(body);

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
