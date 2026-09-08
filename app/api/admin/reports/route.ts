import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../helpers/requireRole";

interface ReportAggregateTransaction {
  id: string;
  total_price: number | null;
  status: string | null;
  vehicle_in: string | null;
  payment_method: string | null;
  services?: { service_name?: string } | { service_name?: string }[] | null;
  transaction_add_ons?: {
    add_on_id: string;
    price: number | null;
    seller_id?: string | null;
  }[];
  transaction_staff?: {
    commission_amount: number | null;
    staffs?: { name?: string } | { name?: string }[] | null;
  }[];
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole("org:admin");
    if (authResult.error) return authResult.error;

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
    const [{ data: addOnsMaster }, { data: staffTxRows }] = await Promise.all([
      supabase.from("add_ons").select("id, label"),
      staffId && staffId !== "all"
        ? supabase
            .from("transaction_staff")
            .select("transaction_id")
            .eq("staff_id", staffId)
        : Promise.resolve({ data: null }),
    ]);
    const addOnMapLookup = new Map(
      (addOnsMaster || []).map((ao: { id: string; label: string }) => [
        ao.id,
        ao.label,
      ]),
    );
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

    // 3. Fetch the aggregate input with only the fields needed for KPIs/charts.
    let kpiQuery = supabase.from("transactions").select(`
        id,
        total_price,
        status,
        vehicle_in,
        payment_method,
        service_id,
        services ( service_name ),
        transaction_add_ons ( add_on_id, price, seller_id ),
        transaction_staff ( commission_amount, staffs ( name ) )
      `);

    if (startIso) kpiQuery = kpiQuery.gte("vehicle_in", startIso);
    if (endIso) kpiQuery = kpiQuery.lt("vehicle_in", endIso);
    if (status && status !== "all") kpiQuery = kpiQuery.eq("status", status);
    if (serviceId && serviceId !== "all")
      kpiQuery = kpiQuery.eq("service_id", serviceId);
    if (paymentMethod && paymentMethod !== "all")
      kpiQuery = kpiQuery.eq("payment_method", paymentMethod);
    if (search) {
      kpiQuery = kpiQuery.or(
        `order_id.ilike.%${search}%,customer_name.ilike.%${search}%,plate_number.ilike.%${search}%`,
      );
    }
    if (staffId && staffId !== "all") {
      kpiQuery = kpiQuery.in(
        "id",
        staffTransactionIds.length > 0 ? staffTransactionIds : ["none"],
      );
    }

    const { data: rawFilteredTx, error: kpiError } = await kpiQuery;
    if (kpiError) throw kpiError;
    const allFilteredTx = (rawFilteredTx || []) as ReportAggregateTransaction[];

    // 4. Compute KPIs
    let totalRevenue = 0;
    const transactionCount = allFilteredTx.length;
    let completedCount = 0;
    let cancelledCount = 0;
    let pendingInProgressCount = 0;
    let totalCommissions = 0;

    const revenueByDayMap: Record<string, number> = {};
    const revenueByServiceMap: Record<string, number> = {};
    const paymentMethodMap: Record<string, number> = {};
    const addOnMap: Record<string, { count: number; revenue: number }> = {};
    const staffCommissionMap: Record<string, number> = {};
    const topUpSellerMap: Record<
      string,
      { name: string; count: number; revenue: number }
    > = {};

    const sellerIds = Array.from(
      new Set(
        allFilteredTx.flatMap((tx) =>
          Array.isArray(tx.transaction_add_ons)
            ? tx.transaction_add_ons
                .map((addOn) => addOn.seller_id)
                .filter(Boolean)
            : [],
        ),
      ),
    );
    const { data: sellers } = sellerIds.length
      ? await supabase.from("staffs").select("id, name").in("id", sellerIds)
      : { data: [] };
    const sellerNameLookup = new Map(
      (sellers || []).map((seller: { id: string; name: string }) => [
        seller.id,
        seller.name,
      ]),
    );

    for (const tx of allFilteredTx) {
      const st = (tx.status || "").toLowerCase();
      if (st === "completed") {
        completedCount++;
        totalRevenue += Number(tx.total_price) || 0;

        if (tx.vehicle_in) {
          const manilaDate = new Date(tx.vehicle_in).toLocaleDateString(
            "en-CA",
            { timeZone: "Asia/Manila" },
          );
          revenueByDayMap[manilaDate] =
            (revenueByDayMap[manilaDate] || 0) + (Number(tx.total_price) || 0);
        }

        const serviceRelation = Array.isArray(tx.services)
          ? tx.services[0]
          : tx.services;
        const servName = serviceRelation?.service_name || "Unknown Service";
        revenueByServiceMap[servName] =
          (revenueByServiceMap[servName] || 0) + (Number(tx.total_price) || 0);
      } else if (st === "cancelled") {
        cancelledCount++;
      } else {
        pendingInProgressCount++;
      }

      const pm = tx.payment_method || "Other";
      paymentMethodMap[pm] = (paymentMethodMap[pm] || 0) + 1;

      if (Array.isArray(tx.transaction_add_ons)) {
        for (const ao of tx.transaction_add_ons) {
          const aoLabel = addOnMapLookup.get(ao.add_on_id) || "Add-on";
          const aoPrice = Number(ao.price) || 0;
          if (!addOnMap[aoLabel]) addOnMap[aoLabel] = { count: 0, revenue: 0 };
          addOnMap[aoLabel].count += 1;
          addOnMap[aoLabel].revenue += aoPrice;

          if (ao.seller_id) {
            const sellerName =
              sellerNameLookup.get(ao.seller_id) || "Unknown Seller";
            if (!topUpSellerMap[ao.seller_id]) {
              topUpSellerMap[ao.seller_id] = {
                name: sellerName,
                count: 0,
                revenue: 0,
              };
            }
            topUpSellerMap[ao.seller_id].count += 1;
            topUpSellerMap[ao.seller_id].revenue += aoPrice;
          }
        }
      }

      if (Array.isArray(tx.transaction_staff)) {
        for (const ts of tx.transaction_staff) {
          const comm = Number(ts.commission_amount) || 0;
          totalCommissions += comm;
          const staffRelation = Array.isArray(ts.staffs)
            ? ts.staffs[0]
            : ts.staffs;
          const sName = staffRelation?.name || "Staff";
          staffCommissionMap[sName] = (staffCommissionMap[sName] || 0) + comm;
        }
      }
    }

    const averageTicket =
      completedCount > 0 ? totalRevenue / completedCount : 0;

    const revenueByDay = Object.keys(revenueByDayMap)
      .sort()
      .map((date) => ({
        date,
        revenue: revenueByDayMap[date],
      }));

    const revenueByService = Object.keys(revenueByServiceMap).map((name) => ({
      service: name,
      revenue: revenueByServiceMap[name],
    }));

    const paymentMethodBreakdown = Object.keys(paymentMethodMap).map(
      (method) => ({
        method,
        count: paymentMethodMap[method],
      }),
    );

    const addOnPerformance = Object.keys(addOnMap).map((label) => ({
      label,
      count: addOnMap[label].count,
      revenue: addOnMap[label].revenue,
    }));

    const staffCommissionSummary = Object.keys(staffCommissionMap).map(
      (name) => ({
        name,
        commission: staffCommissionMap[name],
      }),
    );

    const topUpSellerSummary = Object.values(topUpSellerMap);

    if (exportCsv) {
      return NextResponse.json({
        data: transactionData,
        exportOnly: true,
      });
    }

    return NextResponse.json(
      {
        kpis: {
          totalRevenue,
          transactionCount,
          averageTicket,
          completedCount,
          cancelledCount,
          pendingInProgressCount,
          totalCommissions,
        },
        charts: {
          revenueByDay,
          revenueByService,
          paymentMethodBreakdown,
          addOnPerformance,
          staffCommissionSummary,
          topUpSellerSummary,
        },
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
