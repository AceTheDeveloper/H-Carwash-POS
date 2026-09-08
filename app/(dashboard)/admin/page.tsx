import { supabase } from "@/lib/supabase";
import KPICard from "@/components/dashboard/KPICard";
import { RevenueBarChart } from "@/components/dashboard/RevenueBarChart";
import { ServicesPieChart } from "@/components/dashboard/ServicesPieChart";
import { LiveQueueTable } from "@/components/dashboard/LiveQueueTable";
import { DollarSign, Landmark, Car } from "lucide-react";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";
import { getAppDate } from "@/lib/date";

export default async function DashboardPage() {
  // 1. Fetch transactions with related service names from Supabase
  const { data: rawTransactions, error } = await supabase
    .from("transactions")
    .select(
      "id, order_id, plate_number, vehicle_classification, vehicle_size, total_price, payment_method, status, vehicle_in, vehicle_out, services(service_name)",
    )
    .order("vehicle_in", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Error fetching dashboard data:", error.message);
  }

  const transactions = rawTransactions || [];
  const getServiceName = (transaction: (typeof transactions)[number]) =>
    transaction.services?.[0]?.service_name;

  // 2. Get today's date in Philippine Standard Time (YYYY-MM-DD)
  const todayStr = getAppDate();

  // 3. Filter Today's Transactions
  const todaysTransactions = transactions.filter((txn) => {
    if (!txn.vehicle_in) return false;
    const txnDate = getAppDate(txn.vehicle_in);
    return txnDate === todayStr;
  });

  // Calculate Today's Revenue & Cash/QR breakdown
  const salesToday = todaysTransactions.reduce(
    (sum, txn) => sum + (txn.total_price || 0),
    0,
  );

  const cashSales = todaysTransactions
    .filter((txn) => txn.payment_method?.toLowerCase() === "cash")
    .reduce((sum, txn) => sum + (txn.total_price || 0), 0);

  const qrSales = salesToday - cashSales;

  // Count Active Vehicles "In"
  const activeVehicles = transactions.filter(
    (txn) =>
      txn.status?.toLowerCase() === "in_progress" ||
      txn.status?.toLowerCase() === "pending" ||
      !txn.vehicle_out,
  );

  // 4. Construct KPI Data Array
  const kpiData = [
    {
      title: "Today's Revenue",
      value: `₱${salesToday.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      description: `Cash: ₱${cashSales.toLocaleString()} | QR: ₱${qrSales.toLocaleString()}`,
      icon: DollarSign,
      trend: "Live database sync",
      isHighlight: true,
    },
    {
      title: "Today's Transactions",
      value: `${todaysTransactions.length} Services`,
      description: "Completed tickets today",
      icon: Landmark,
      trend: "Real-time count",
    },
    {
      title: "Cars Active 'In'",
      value: `${activeVehicles.length} Vehicles`,
      description: "Currently in bay / washing",
      icon: Car,
      trend: "Active queue count",
      badgeColor:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ];

  // 5. Prepare Weekly Revenue Chart Data (Last 7 Days)
  const daysMap: { [key: string]: number } = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    daysMap[getAppDate(d)] = 0;
  }

  transactions.forEach((txn) => {
    if (!txn.vehicle_in) return;
    const day = getAppDate(txn.vehicle_in);
    if (daysMap[day] !== undefined) {
      daysMap[day] += txn.total_price || 0;
    }
  });

  const revenueChartData = Object.keys(daysMap).map((date) => ({
    day: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    }),
    revenue: daysMap[date],
  }));

  // 6. Prepare Popular Services Pie Chart Data
  const serviceCounts: { [key: string]: number } = {};
  transactions.forEach((txn) => {
    const name = getServiceName(txn) || "Other Services";
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });

  const pieChartColors = [
    "var(--color-primary)",
    "var(--color-primary-light)",
    "var(--color-secondary)",
    "var(--color-secondary-light)",
  ];

  const servicesPieData = Object.entries(serviceCounts).map(
    ([service, count], idx) => ({
      service,
      count,
      fill: pieChartColors[idx % pieChartColors.length],
    }),
  );

  const totalWashesCount = transactions.length;

  // 7. Prepare Live Queue Table Data
  const liveQueueData = activeVehicles.slice(0, 5).map((txn) => {
    const timeInFormatted = txn.vehicle_in
      ? new Date(txn.vehicle_in).toLocaleTimeString("en-PH", {
          timeZone: "Asia/Manila",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A";

    return {
      id: txn.order_id || txn.id,
      plateNo: txn.plate_number || "NO-PLATE",
      vehicle: `${txn.vehicle_classification || "Vehicle"} (${txn.vehicle_size || "Standard"})`,
      service: getServiceName(txn) || "Standard Service",
      total: `₱${(txn.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      timeIn: timeInFormatted,
      status: txn.status === "in_progress" ? "Washing" : "Queued",
    };
  });

  return (
    <div className="space-y-6">
      <DashboardRealtime />
      {/* Greetings Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Good Morning, Admin!
          </h1>
          <p className="text-text-secondary text-sm">
            Here is what&apos;s happening at the shop right now.
          </p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-md shadow-sm transition-colors text-sm flex items-center justify-center gap-2">
          <span>+ New Transaction</span>
        </button>
      </div>

      {/* KPI CARD SECTION */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              icon={kpi.icon}
              trend={kpi.trend}
              isHighlight={kpi.isHighlight}
              badgeColor={kpi.badgeColor}
            />
          ))}
        </div>
      </section>

      {/* CHARTS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueBarChart chartData={revenueChartData} />
        </div>
        <div className="lg:col-span-1">
          <ServicesPieChart
            chartData={servicesPieData}
            totalCount={totalWashesCount}
          />
        </div>
      </section>

      {/* LIVE QUEUE TABLE SECTION */}
      <section>
        <LiveQueueTable queueData={liveQueueData} />
      </section>
    </div>
  );
}
