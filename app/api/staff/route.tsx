import { supabase } from "@/lib/supabase";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("staffs")
      .select("*")
      .order("name");

    if (error) {
      console.log("Error : ", error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.log("Error : ", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { error } = await supabase.from("staffs").insert(body);

    if (error) {
      console.log("Error : ", error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Data inserted" }, { status: 200 });
  } catch (error) {
    console.log("Error : ", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
