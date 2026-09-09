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
  Eye,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { TransactionData } from "@/types/TransactionData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionData | null>(null);

  const formatDateTime = (value: string | null) =>
    value
      ? new Date(value).toLocaleString("en-PH", {
          timeZone: "Asia/Manila",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "";

  // Real-time filtering for the search bar (safely guarded against null fields)
  const getManilaDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString("en-CA", {
          timeZone: "Asia/Manila",
        })
      : "";

  const getDateFilterStart = () => {
    const today = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
    );

    if (dateFilter === "all") return null;

    const start = new Date(today);
    if (dateFilter === "yesterday") start.setDate(start.getDate() - 1);
    if (dateFilter === "this_week") {
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    }
    if (dateFilter === "this_month") start.setDate(1);

    return start.toLocaleDateString("en-CA");
  };

  const dateFilterStart = getDateFilterStart();
  const todayDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
  );
  const todayDateString = todayDate.toLocaleDateString("en-CA");
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDateString = yesterdayDate.toLocaleDateString("en-CA");

  const filteredTransactions = initialTransactions.filter((txn) => {
    const term = search.toLowerCase();
    const customerName = txn.customer_name || "";
    const plateNumber = txn.plate_number || "";
    const orderId = txn.order_id || txn.id || "";
    const serviceName = txn.services?.service_name || "";
    const transactionDate = getManilaDate(txn.vehicle_in);
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" && transactionDate === todayDateString) ||
      (dateFilter === "yesterday" && transactionDate === yesterdayDateString) ||
      (dateFilter !== "today" &&
        dateFilter !== "yesterday" &&
        dateFilterStart !== null &&
        transactionDate >= dateFilterStart &&
        transactionDate <= todayDateString);
    const matchesStatus =
      statusFilter === "all" || txn.status?.toLowerCase() === statusFilter;

    return (
      matchesDate &&
      matchesStatus &&
      (customerName.toLowerCase().includes(term) ||
        plateNumber.toLowerCase().includes(term) ||
        orderId.toLowerCase().includes(term) ||
        serviceName.toLowerCase().includes(term))
    );
  });

  const exportSpreadsheet = async () => {
    if (filteredTransactions.length === 0) return;

    const { utils, writeFile } = await import("xlsx");
    const rows = filteredTransactions.map((txn) => ({
      Code: txn.order_id || txn.id || "",
      Brand: txn.car_brand || "",
      "Plate No": txn.plate_number || "",
      Services: txn.services?.service_name || "Unknown Service",
      Amount: Number(txn.total_price || 0),
      Remarks: txn.payment_method || "",
      "Vehicle In": formatDateTime(txn.vehicle_in),
      "Vehicle Out": formatDateTime(txn.vehicle_out),
      "Cellphone No": txn.contact_number || "",
    }));

    const worksheet = utils.json_to_sheet(rows, {
      header: [
        "Code",
        "Brand",
        "Plate No",
        "Services",
        "Amount",
        "Remarks",
        "Vehicle In",
        "Vehicle Out",
        "Cellphone No",
      ],
    });
    worksheet["!cols"] = [
      { wch: 14 }, // Code
      { wch: 16 }, // Brand
      { wch: 14 }, // Plate No
      { wch: 24 }, // Services
      { wch: 12 }, // Amount
      { wch: 14 }, // Remarks
      { wch: 24 }, // Vehicle In
      { wch: 24 }, // Vehicle Out
      { wch: 16 }, // Cellphone No
    ];

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Transactions");
    writeFile(workbook, "transactions.xlsx");
  };

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
          onClick={exportSpreadsheet}
          disabled={filteredTransactions.length === 0}
          className="w-full sm:w-auto bg-background shadow-sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Spreadsheet
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
              <label className="relative flex flex-1 lg:flex-none items-center rounded-md border border-border bg-background px-3 h-10 text-xs sm:text-sm">
                <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <select
                  aria-label="Filter transactions by date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent pl-8 pr-7 outline-none"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="all">All Dates</option>
                </select>
                <span className="pointer-events-none ml-auto">
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </span>
              </label>
              <label className="relative flex flex-1 lg:flex-none items-center rounded-md border border-border bg-background px-3 h-10 text-xs sm:text-sm">
                <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <select
                  aria-label="Filter transactions by status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent pl-8 pr-7 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span className="pointer-events-none ml-auto">
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </span>
              </label>
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
                              onClick={() => setSelectedTransaction(txn)}
                              aria-label={`View transaction ${txn.order_id || txn.id}`}
                              title="View transaction details"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
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
                        {search.trim()
                          ? `No transactions found matching "${search}".`
                          : "No transactions found for the selected filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Dialog
        open={selectedTransaction !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          {selectedTransaction && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Transaction {selectedTransaction.order_id || "Details"}
                </DialogTitle>
                <DialogDescription>
                  Complete checkout and service information for this session.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {selectedTransaction.customer_name || "Guest"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cellphone</p>
                  <p className="font-medium">
                    {selectedTransaction.contact_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Brand</p>
                  <p className="font-medium">
                    {selectedTransaction.car_brand || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plate No</p>
                  <p className="font-medium font-mono">
                    {selectedTransaction.plate_number || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="font-medium">
                    {selectedTransaction.vehicle_classification || "-"} /{" "}
                    {selectedTransaction.vehicle_size || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-medium">
                    {selectedTransaction.services?.service_name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="font-medium capitalize">
                    {selectedTransaction.payment_method || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold">
                    ₱{Number(selectedTransaction.total_price || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">In</p>
                  <p className="font-medium">
                    {formatDateTime(selectedTransaction.vehicle_in) || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Out</p>
                  <p className="font-medium">
                    {formatDateTime(selectedTransaction.vehicle_out) || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <h3 className="font-semibold">Add-ons</h3>
                {selectedTransaction.transaction_add_ons?.length ? (
                  selectedTransaction.transaction_add_ons.map((addOn) => (
                    <div
                      key={addOn.id}
                      className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span>{addOn.label || "Add-on"}</span>
                      <span>₱{Number(addOn.price || 0).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No add-ons.</p>
                )}
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <h3 className="font-semibold">Staff</h3>
                {selectedTransaction.transaction_staff?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTransaction.transaction_staff.map((member) => (
                      <Badge
                        key={member.staff_id}
                        variant="secondary"
                        className="bg-muted"
                      >
                        {member.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No staff assigned.
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <h3 className="font-semibold">Promotion</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTransaction.promo?.name || "No promotion applied."}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
