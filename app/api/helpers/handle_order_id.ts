import { supabase } from "@/lib/supabase";

export default async function handleOrderId(): Promise<string> {
  try {
    // Fetch the latest order ID based on creation date
    const { data, error } = await supabase
      .from("transactions")
      .select("order_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    let nextNumber = 1;

    if (data && data.order_id) {
      const match = data.order_id.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format the new order ID with zero-padding (e.g., H-ORD-0001)
    const paddedNumber = String(nextNumber).padStart(4, "0");
    return `H-ORD-${paddedNumber}`;
  } catch (error) {
    console.error("Error generating order ID:", error);
    throw error;
  }
}
