import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// 1. Swap the order! 'req' comes first, 'context' (with params) comes second.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { error } = await supabase.from("services").update(body).eq("id", id);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(
        { message: "Database Error", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Saved Successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      console.log(error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Deleted Successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
