import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { error } = await supabase.from("promos").update(body).eq("id", id);

    if (error) {
      console.log("ERROR", error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "success" }, { status: 200 });
  } catch (error) {
    console.log("ERROR", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
