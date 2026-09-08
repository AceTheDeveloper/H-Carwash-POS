import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../helpers/requireRole";
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole("org:admin");
    if (authResult.error) return authResult.error;
    const body = await req.json();

    const { error } = await supabase.from("add_ons").insert(body);

    if (error) {
      console.log(error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Add-On Created Successfully" },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(["org:admin", "org:member"]);
    if (authResult.error) return authResult.error;
    const { data, error } = await supabase.from("add_ons").select();

    if (error) {
      console.log(error.message);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
