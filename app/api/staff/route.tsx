import { supabase } from "@/lib/supabase";
import { NextResponse, NextRequest } from "next/server";
import { requireRole } from "../helpers/requireRole";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(["org:admin", "org:member"]);
    if (authResult.error) return authResult.error;
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
    console.log(
      "Error : ",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole("org:admin");
    if (authResult.error) return authResult.error;
    const body = await req.json();

    // Optional: Basic validation check
    if (!body.name) {
      return NextResponse.json(
        { message: "Staff name is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("staffs")
      .insert([body])
      .select()
      .single();

    if (error) {
      console.log("Error : ", error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Data inserted", data },
      { status: 200 },
    );
  } catch (error) {
    console.log(
      "Error : ",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
