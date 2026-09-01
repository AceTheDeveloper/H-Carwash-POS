import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("inclusions")
      .select("*")
      .order("label");

    if (error) {
      console.log(error);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {}
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  console.log("BODY : ", body);

  try {
    // ZOD SCHEMA SOON
    const { error } = await supabase.from("inclusions").insert(body);

    if (error) {
      console.log(error);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Saved Successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
