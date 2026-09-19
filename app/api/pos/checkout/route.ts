import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../helpers/requireRole";
import { PromoData } from "@/types/PromoData";

interface CheckoutAddOn {
  id: string;
  price: number;
  seller_id?: string | null;
  is_promo_item?: boolean;
}

interface CheckoutBody {
  order_id: string;
  customer_name: string;
  contact_number?: string;
  plate_number: string;
  car_brand: string;
  vehicle_classification: string;
  vehicle_size: string;
  service_id: string;
  service_price: number;
  add_ons?: CheckoutAddOn[];
  promo?: PromoData | null;
  payment_method: string;
  staff?: string[];
  total_price: number;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(["org:admin", "org:member"]);
    if (authResult.error) return authResult.error;

    const body = (await req.json()) as CheckoutBody;

    if (
      !body.customer_name?.trim() ||
      !body.plate_number?.trim() ||
      !body.service_id ||
      !body.payment_method ||
      !Array.isArray(body.staff) ||
      body.staff.length === 0
    ) {
      return NextResponse.json({ message: "Missing required checkout fields" }, { status: 400 });
    }

    const addOns = Array.isArray(body.add_ons)
      ? body.add_ons.map((addon) => ({
          id: addon.id,
          price: Number(addon.price) || 0,
          seller_id: addon.seller_id || null,
        }))
      : [];

    let appliedPromo: PromoData | null = null;

    if (body.promo?.id) {
      const { data: promo, error: promoError } = await supabase
        .from("promos")
        .select("*")
        .eq("id", body.promo.id)
        .maybeSingle();

      if (promoError) {
        return NextResponse.json({ message: "Failed to validate promotion" }, { status: 500 });
      }
      if (!promo || !promo.is_active) {
        return NextResponse.json({ message: "Promotion is no longer active" }, { status: 409 });
      }

      let rewardAddOn = null;
      if (promo.reward_add_on_id) {
        const { data: reward, error: rewardError } = await supabase
          .from("add_ons")
          .select("id, label, price")
          .eq("id", promo.reward_add_on_id)
          .maybeSingle();

        if (rewardError || !reward) {
          return NextResponse.json({ message: "Promotion reward is no longer available" }, { status: 409 });
        }
        rewardAddOn = reward;

        const alreadyIncluded = addOns.some((addon) => String(addon.id) === String(reward.id));
        if (!alreadyIncluded) {
          addOns.push({
            id: reward.id,
            price: Number(promo.reward_price ?? 0),
            seller_id: null,
          });
        } else {
          const rewardLine = addOns.find((addon) => String(addon.id) === String(reward.id));
          if (rewardLine) {
            rewardLine.price = Number(promo.reward_price ?? 0);
            rewardLine.seller_id = null;
          }
        }
      }

      appliedPromo = { ...promo, reward_add_on: rewardAddOn };
    }

    const addonsTotal = addOns.reduce((sum, addon) => sum + addon.price, 0);
    const subtotal = Number(body.service_price) + addonsTotal;

    let expectedTotal = subtotal;
    if (appliedPromo?.promo_type === "discount") {
      if (appliedPromo.discount_type === "percentage") {
        expectedTotal -= subtotal * (Number(appliedPromo.value) / 100);
      } else {
        expectedTotal -= Number(appliedPromo.value);
      }
    }

    expectedTotal = Math.max(0, Number(expectedTotal.toFixed(2)));

    if (Math.abs(expectedTotal - Number(body.total_price)) > 0.01) {
      return NextResponse.json(
        { message: "Checkout total changed. Please reapply the promotion and try again." },
        { status: 409 },
      );
    }

    const transactionData = {
      order_id: body.order_id,
      customer_name: body.customer_name,
      contact_number: body.contact_number,
      plate_number: body.plate_number,
      car_brand: body.car_brand,
      vehicle_classification: body.vehicle_classification,
      vehicle_size: body.vehicle_size,
      service_id: body.service_id,
      service_price: Number(body.service_price) || 0,
      payment_method: body.payment_method,
      status: "pending",
      promo: appliedPromo,
      vehicle_in: new Date().toISOString(),
      vehicle_out: null,
      total_price: expectedTotal,
    };

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select("id")
      .single();

    if (transactionError || !transaction) {
      console.log("Transaction Insert Error:", transactionError?.message);
      return NextResponse.json(
        { message: "Failed to insert transaction", error: transactionError?.message },
        { status: 500 },
      );
    }

    if (addOns.length > 0) {
      const addOnsData = addOns.map((addon) => ({
        transaction_id: transaction.id,
        add_on_id: addon.id,
        price: addon.price,
        seller_id: addon.seller_id || null,
      }));

      const { error: addOnsError } = await supabase
        .from("transaction_add_ons")
        .insert(addOnsData);

      if (addOnsError) {
        console.log("Add-ons Insert Error:", addOnsError.message);
        return NextResponse.json(
          { message: "Transaction created, but failed to insert add-ons", error: addOnsError.message },
          { status: 500 },
        );
      }
    }

    if (body.staff.length > 0) {
      const staffData = body.staff.map((staffId) => ({
        transaction_id: transaction.id,
        staff_id: staffId,
      }));

      const { error: staffError } = await supabase
        .from("transaction_staff")
        .insert(staffData);

      if (staffError) {
        console.log("Staff Assignment Insert Error:", staffError.message);
        return NextResponse.json(
          { message: "Transaction created, but failed to assign staff", error: staffError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { message: "Transaction, add-ons, and staff inserted successfully" },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}
