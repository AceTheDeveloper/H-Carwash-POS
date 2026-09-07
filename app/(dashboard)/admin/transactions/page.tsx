// app/transactions/page.tsx
import { supabase } from "@/lib/supabase";
import TransactionsClient from "@/components/dashboard/transactions/TransactionClient";
import { TransactionData } from "@/types/TransactionData";

export default async function TransactionsPage() {
  // 1. Fetch data directly from Supabase on the server (Includes Add-ons and Service names)
  const { data: rawTransactions, error } = await supabase
    .from("transactions")
    .select("*, transaction_add_ons(*), services(service_name)")
    .order("vehicle_in", { ascending: false });

  if (error) {
    console.error("Failed to fetch transactions:", error.message);
  }

  const transactions: TransactionData[] = rawTransactions || [];

  // 2. Calculate Real-Time KPIs for TODAY
  const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const todaysTransactions = transactions.filter((txn) => {
    if (!txn.vehicle_in) return false;
    return txn.vehicle_in.startsWith(todayStr);
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
