"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Receipt,
  Car,
  Award,
  MoreHorizontal,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { TransactionData } from "@/types/TransactionData";

// --- Sub-component for individual Mapped KPI Cards ---
interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  subtitleColor?: string;
  icon: LucideIcon;
}

function KPICard({
  title,
  value,
  subtitle,
  subtitleColor = "text-muted-foreground",
  icon: Icon,
}: KPICardProps) {
  return (
    <div className="p-5 bg-card rounded-xl border border-border/60 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 bg-primary/10 rounded-md text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-foreground leading-tight truncate">
          {value}
        </h3>
        <p className={`text-xs font-medium mt-1 ${subtitleColor}`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// --- Main Client Component ---
interface TransactionsClientProps {
  initialTransactions: TransactionData[];
  kpis: {
    salesToday: number;
    transactionsToday: number;
    avgOrderValue: number;
    topService: string;
  };
}

export default function TransactionsClient({
  initialTransactions,
  kpis,
}: TransactionsClientProps) {
  const [search, setSearch] = useState<string>("");

  // Real-time filtering for the search bar (safely guarded against null fields)
  const filteredTransactions = initialTransactions.filter((txn) => {
    const term = search.toLowerCase();
    const customerName = txn.customer_name || "";
    const plateNumber = txn.plate_number || "";
    const orderId = txn.order_id || txn.id || "";
    const serviceName = txn.services?.service_name || "";

    return (
      customerName.toLowerCase().includes(term) ||
      plateNumber.toLowerCase().includes(term) ||
      orderId.toLowerCase().includes(term) ||
      serviceName.toLowerCase().includes(term)
    );
  });

  // Mapped KPI configurations array
  const kpiList = [
    {
      title: "Sales Today",
      value: `₱${kpis.salesToday.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: "Live from database",
      subtitleColor: "text-emerald-500",
      icon: TrendingUp,
    },
    {
      title: "Orders Today",
      value: kpis.transactionsToday.toString(),
      subtitle: "Total visits today",
      subtitleColor: "text-muted-foreground",
      icon: Receipt,
    },
    {
      title: "Avg. Ticket Size",
      value: `₱${kpis.avgOrderValue.toFixed(2)}`,
      subtitle: "Per transaction today",
      subtitleColor: "text-muted-foreground",
      icon: Car,
    },
    {
      title: "Top Service",
      value: kpis.topService,
      subtitle: "Most popular today",
      subtitleColor: "text-primary",
      icon: Award,
    },
  ];

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
            In Progress
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground">{status}</Badge>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-8 p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Transactions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor sales, track daily orders, and manage checkout history.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto bg-background shadow-sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <main className="flex flex-col space-y-8">
        {/* Mapped KPI Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiList.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              subtitle={kpi.subtitle}
              subtitleColor={kpi.subtitleColor}
              icon={kpi.icon}
            />
          ))}
        </section>

        {/* Toolbar & Table Section */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-xs">
            <div className="relative w-full lg:max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plate number, name, or service..."
                className="pl-9 bg-background border-border h-10 w-full"
              />
            </div>
            <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
              <Button
                variant="outline"
                className="flex-1 lg:flex-none bg-background border-border h-10 text-xs sm:text-sm"
              >
                <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Today <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
              </Button>
              <Button
                variant="outline"
                className="flex-1 lg:flex-none bg-background border-border h-10 text-xs sm:text-sm"
              >
                <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Status
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-card rounded-xl border border-border/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-4">Details</th>
                    <th className="px-5 py-4">Customer & Vehicle</th>
                    <th className="px-5 py-4">Service</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Total (₱)</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((txn: TransactionData) => {
                      const addOnsCount = txn.transaction_add_ons?.length || 0;

                      return (
                        <tr
                          key={txn.id}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          {/* Order Details */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <p className="font-semibold text-foreground">
                              {txn.order_id || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {txn.vehicle_in
                                ? new Date(txn.vehicle_in).toLocaleString(
                                    "en-PH",
                                    {
                                      timeZone: "Asia/Manila",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    },
                                  )
                                : "N/A"}
                            </p>
                          </td>

                          {/* Customer & Vehicle */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <p className="font-medium text-foreground">
                              {txn.customer_name || "Unknown"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground/70">
                                {txn.plate_number || "NO-PLATE"}
                              </span>
                              <span>•</span>
                              <span>{txn.vehicle_classification || "N/A"}</span>
                            </div>
                          </td>

                          {/* Service Name */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">
                                {txn.services?.service_name ||
                                  "Unknown Service"}
                              </p>
                              {txn.promo && (
                                <Badge
                                  variant="outline"
                                  className="h-5 px-1.5 text-[10px] bg-primary/5 text-primary border-primary/20"
                                >
                                  PROMO
                                </Badge>
                              )}
                            </div>
                            {addOnsCount > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                + {addOnsCount} Add-on
                                {addOnsCount > 1 ? "s" : ""}
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {getStatusBadge(txn.status)}
                          </td>

                          {/* Total Price */}
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <p className="font-bold text-foreground">
                              ₱{(txn.total_price || 0).toFixed(2)}
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-muted"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-sm text-muted-foreground border-dashed"
                      >
                        No transactions found matching "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
