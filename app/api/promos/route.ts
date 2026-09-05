import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("promos")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.log("ERROR : ", error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.log("ERROR : ", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { error } = await supabase.from("promos").insert(body);

    if (error) {
      console.log("ERROR : ", error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }
    return NextResponse.json({ message: "Inserted" }, { status: 200 });
  } catch (error) {
    console.log("ERROR : ", error.message);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
