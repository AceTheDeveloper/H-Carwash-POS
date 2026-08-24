import KPICard from "@/components/dashboard/KPICard";
import { RevenueBarChart } from "@/components/dashboard/RevenueBarChart";
import { ServicesPieChart } from "@/components/dashboard/ServicesPieChart";
import { LiveQueueTable } from "@/components/dashboard/LiveQueueTable";
import { DollarSign, Landmark, Car } from "lucide-react";

const MOCK_KPI_DATA = [
  {
    title: "Today's Revenue",
    value: "₱14,850.00",
    description: "Cash: ₱8,200 | QR: ₱6,650",
    icon: DollarSign,
    trend: "+12% vs yesterday",
    isHighlight: true,
  },
  {
    title: "Today's Transactions",
    value: "28 Services",
    description: "Completed tickets today",
    icon: Landmark,
    trend: "Target: 40 daily",
  },
  {
    title: "Cars Active 'In'",
    value: "5 Vehicles",
    description: "Currently in bay / washing",
    icon: Car,
    trend: "2 ready for pickup",
    badgeColor:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
];

function Dashboard() {
  return (
    <div className="space-y-6">
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
          {MOCK_KPI_DATA.map((kpi, index) => (
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

      {/* NEW CHARTS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue Trends takes up 2 columns */}
        <div className="lg:col-span-2">
          <RevenueBarChart />
        </div>
        {/* Most Availed Services breakout takes up 1 column */}
        <div className="lg:col-span-1">
          <ServicesPieChart />
        </div>
      </section>

      <section>
        <LiveQueueTable />
      </section>
    </div>
  );
}

export default Dashboard;
