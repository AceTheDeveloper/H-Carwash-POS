import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireRole } from "../../helpers/requireRole";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole("org:admin");
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ message: "Promo name is required" }, { status: 400 });
    }

    if (!["discount", "free_add_on", "special_add_on_price"].includes(body.promo_type)) {
      return NextResponse.json({ message: "Invalid promo type" }, { status: 400 });
    }

    const payload = {
      ...body,
      value: body.promo_type === "discount" ? Number(body.value) : 0,
      reward_add_on_id: body.promo_type === "discount" ? null : body.reward_add_on_id,
      reward_price: body.promo_type === "discount" ? null : Number(body.reward_price),
    };

    const { error } = await supabase.from("promos").update(payload).eq("id", id);

    if (error) {
      console.log("ERROR", error.message);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json({ message: "success" }, { status: 200 });
  } catch (error) {
    console.log("ERROR", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
