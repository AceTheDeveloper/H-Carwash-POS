import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { error } = await supabase.from("staffs").update(body).eq("id", id);

    if (error) {
      console.log("error", error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error) {
    console.log("error", error.message);
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

    const { error } = await supabase.from("staffs").delete().eq("id", id);

    if (error) {
      console.log("error", error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error) {
    console.log("error", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
