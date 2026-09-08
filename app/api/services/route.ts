import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireRole } from "../helpers/requireRole";

export async function POST(req: NextRequest) {
  const authResult = await requireRole("org:admin");
  if (authResult.error) return authResult.error;
  const body = await req.json();

  try {
    const { error } = await supabase.from("services").insert(body);

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

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(["org:admin", "org:member"]);
    if (authResult.error) return authResult.error;
    const { data, error } = await supabase.from("services").select();

    if (error) {
      console.log(error);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
