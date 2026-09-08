import { getSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../helpers/requireRole";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole("org:admin");
    if (authResult.error) return authResult.error;
    const supabase = await getSupabaseClient();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const status = searchParams.get("status"); // completed, cancelled, pending, etc.
    const serviceId = searchParams.get("serviceId");
    const paymentMethod = searchParams.get("paymentMethod");
    const staffId = searchParams.get("staffId");
    const search = searchParams.get("search") || "";
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize")) || 15, 1),
      100,
    );
    const exportCsv = searchParams.get("export") === "true";

    // 1. Timezone conversion (Asia/Manila UTC+8)
    let startIso: string | undefined;
    let endIso: string | undefined;

    if (startDate) {
      startIso = new Date(`${startDate}T00:00:00+08:00`).toISOString();
    }
    if (endDate) {
      const endDateTime = new Date(`${endDate}T00:00:00+08:00`);
      endDateTime.setDate(endDateTime.getDate() + 1);
      endIso = endDateTime.toISOString();
    }

    // Fetch master add_ons for label lookup to avoid PGRST200 relationship errors
    const { data: staffTxRows } = await (staffId && staffId !== "all"
      ? supabase
          .from("transaction_staff")
          .select("transaction_id")
          .eq("staff_id", staffId)
      : Promise.resolve({ data: null }));
    const staffTransactionIds = (staffTxRows || []).map(
      (row: { transaction_id: string }) => row.transaction_id,
    );

    // 2. Base query builder for transactions
    let query = supabase.from("transactions").select(
      `
        id,
        order_id,
        customer_name,
        plate_number,
        vehicle_classification,
        vehicle_size,
        service_id,
        service_price,
        total_price,
        payment_method,
        status,
        vehicle_in,
        vehicle_out,
        created_at,
        services ( id, service_name ),
        transaction_add_ons (
          id,
          add_on_id,
          price,
          seller_id
        ),
        transaction_staff (
          id,
          staff_id,
          commission_amount,
          staffs ( id, name )
        )
      `,
      { count: "exact" },
    );

    // Apply date range on vehicle_in
    if (startIso) query = query.gte("vehicle_in", startIso);
    if (endIso) query = query.lt("vehicle_in", endIso);

    // Apply filters
    if (status && status !== "all") query = query.eq("status", status);
    if (serviceId && serviceId !== "all")
      query = query.eq("service_id", serviceId);
    if (paymentMethod && paymentMethod !== "all")
      query = query.eq("payment_method", paymentMethod);

    if (search) {
      query = query.or(
        `order_id.ilike.%${search}%,customer_name.ilike.%${search}%,plate_number.ilike.%${search}%`,
      );
    }

    if (staffId && staffId !== "all") {
      query = query.in(
        "id",
        staffTransactionIds.length > 0 ? staffTransactionIds : ["none"],
      );
    }

    let transactionData: Record<string, unknown>[] = [];
    let totalCount = 0;

    if (exportCsv) {
      const { data, error } = await query
        .order("vehicle_in", {
          ascending: false,
        })
        .limit(5000);
      if (error) throw error;
      transactionData = (data || []) as Record<string, unknown>[];
    } else {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query
        .order("vehicle_in", { ascending: false })
        .range(from, to);

      if (error) throw error;
      transactionData = (data || []) as Record<string, unknown>[];
      totalCount = count || 0;
    }

    const { data: aggregates, error: aggregateError } = await supabase.rpc(
      "get_report_aggregates",
      {
        p_start_at: startIso ?? null,
        p_end_at: endIso ?? null,
        p_status: status && status !== "all" ? status : null,
        p_service_id: serviceId && serviceId !== "all" ? serviceId : null,
        p_payment_method:
          paymentMethod && paymentMethod !== "all" ? paymentMethod : null,
        p_staff_id: staffId && staffId !== "all" ? staffId : null,
        p_search: search || null,
      },
    );
    if (aggregateError) throw aggregateError;

    if (exportCsv) {
      return NextResponse.json({
        data: transactionData,
        exportOnly: true,
      });
    }

    return NextResponse.json(
      {
        kpis: aggregates?.kpis || {},
        charts: aggregates?.charts || {},
        transactions: transactionData,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize) || 1,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reports API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Internal Server Error", error: message },
      { status: 500 },
    );
  }
}
