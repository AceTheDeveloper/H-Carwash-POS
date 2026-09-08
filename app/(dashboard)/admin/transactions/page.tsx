// app/transactions/page.tsx
import TransactionsClient from "@/components/dashboard/transactions/TransactionClient";
import { getAppDate } from "@/lib/date";
import { getSupabaseClient } from "@/lib/supabase-server";
import { TransactionAddOn, TransactionData } from "@/types/TransactionData";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TransactionsPage() {
  const supabase = await getSupabaseClient();
  const [
    { data: rawTransactions, error },
    { data: addOns },
    { data: staffAssignments },
    { data: staff },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, transaction_add_ons(*), services(service_name)")
      .order("vehicle_in", { ascending: false }),
    supabase.from("add_ons").select("id, label"),
    supabase.from("transaction_staff").select("transaction_id, staff_id"),
    supabase.from("staffs").select("id, name"),
  ]);

  if (error) {
    console.error("Failed to fetch transactions:", error.message);
  }

  const addOnLabels = new Map(
    (addOns || []).map((addOn) => [addOn.id, addOn.label]),
  );
  const staffNames = new Map(
    (staff || []).map((member) => [member.id, member.name]),
  );
  const staffByTransaction = new Map<
    string,
    { staff_id: string; name: string }[]
  >();

  for (const assignment of staffAssignments || []) {
    const current = staffByTransaction.get(assignment.transaction_id) || [];
    current.push({
      staff_id: assignment.staff_id,
      name: staffNames.get(assignment.staff_id) || "Unknown Staff",
    });
    staffByTransaction.set(assignment.transaction_id, current);
  }

  const transactions: TransactionData[] = (rawTransactions || []).map(
    (txn) => ({
      ...txn,
      transaction_add_ons: (txn.transaction_add_ons || []).map(
        (addOn: TransactionAddOn) => ({
          ...addOn,
          label: addOnLabels.get(addOn.add_on_id) || "Unknown Add-on",
        }),
      ),
      transaction_staff: staffByTransaction.get(txn.id) || [],
    }),
  );

  // 2. Calculate Real-Time KPIs for TODAY
  const todayStr = getAppDate();

  const todaysTransactions = transactions.filter((txn) => {
    if (!txn.vehicle_in) return false;
    return getAppDate(txn.vehicle_in) === todayStr;
  });

  const salesToday = todaysTransactions.reduce(
    (sum, txn) => sum + (txn.total_price || 0),
    0,
  );

  const transactionsTodayCount = todaysTransactions.length;

  const avgOrderValue =
    transactionsTodayCount > 0 ? salesToday / transactionsTodayCount : 0;

  // Find top-selling service today
  const serviceCounts: { [key: string]: number } = {};
  todaysTransactions.forEach((txn) => {
    const serviceName = txn.services?.service_name || "Unknown Service";
    serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
  });

  let topService = "None today";
  let maxCount = 0;
  Object.entries(serviceCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topService = name;
    }
  });

  const kpis = {
    salesToday,
    transactionsToday: transactionsTodayCount,
    avgOrderValue,
    topService,
  };

  // 3. Pass data and calculated KPIs down to your interactive client component
  return <TransactionsClient initialTransactions={transactions} kpis={kpis} />;
}
