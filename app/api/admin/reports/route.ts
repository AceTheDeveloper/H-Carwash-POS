import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { orgRole } = await auth();
    if (orgRole !== "org:admin") {
      return NextResponse.json(
        { message: "Unauthorized: Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const status = searchParams.get("status"); // completed, cancelled, pending, etc.
    const serviceId = searchParams.get("serviceId");
    const paymentMethod = searchParams.get("paymentMethod");
    const staffId = searchParams.get("staffId");
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 15;
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
    const { data: addOnsMaster } = await supabase
      .from("add_ons")
      .select("id, label");
    const addOnMapLookup = new Map(
      (addOnsMaster || []).map((ao: any) => [ao.id, ao.label]),
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
          price
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
      const { data: staffTxRows } = await supabase
        .from("transaction_staff")
        .select("transaction_id")
        .eq("staff_id", staffId);
      const txIds = (staffTxRows || []).map((r) => r.transaction_id);
      query = query.in("id", txIds.length > 0 ? txIds : ["none"]);
    }

    let transactionData: any[] = [];
    let totalCount = 0;

    if (exportCsv) {
      const { data, error } = await query.order("vehicle_in", {
        ascending: false,
      });
      if (error) throw error;
      transactionData = data || [];
    } else {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query
        .order("vehicle_in", { ascending: false })
        .range(from, to);

      if (error) throw error;
      transactionData = data || [];
      totalCount = count || 0;
    }

    // 3. Fetch dataset for KPI calculations & Charts matching filters
    let kpiQuery = supabase.from("transactions").select(`
        id,
        total_price,
        status,
        vehicle_in,
        payment_method,
        service_id,
        services ( service_name ),
        transaction_add_ons ( add_on_id, price ),
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
      const { data: staffTxRows } = await supabase
        .from("transaction_staff")
        .select("transaction_id")
        .eq("staff_id", staffId);
      const txIds = (staffTxRows || []).map((r) => r.transaction_id);
      kpiQuery = kpiQuery.in("id", txIds.length > 0 ? txIds : ["none"]);
    }

    const { data: allFilteredTx, error: kpiError } = await kpiQuery;
    if (kpiError) throw kpiError;

    // 4. Compute KPIs
    let totalRevenue = 0;
    let transactionCount = allFilteredTx.length;
    let completedCount = 0;
    let cancelledCount = 0;
    let pendingInProgressCount = 0;
    let totalCommissions = 0;

    const revenueByDayMap: Record<string, number> = {};
    const revenueByServiceMap: Record<string, number> = {};
    const paymentMethodMap: Record<string, number> = {};
    const addOnMap: Record<string, { count: number; revenue: number }> = {};
    const staffCommissionMap: Record<string, number> = {};

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

        const servName =
          (tx.services as any)?.service_name || "Unknown Service";
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
        }
      }

      if (Array.isArray(tx.transaction_staff)) {
        for (const ts of tx.transaction_staff) {
          const comm = Number(ts.commission_amount) || 0;
          totalCommissions += comm;
          const sName = (ts.staffs as any)?.name || "Staff";
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
  } catch (error: any) {
    console.error("Reports API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 },
    );
  }
}
