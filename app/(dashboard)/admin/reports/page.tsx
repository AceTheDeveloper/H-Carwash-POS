"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import useServices from "@/hooks/useServices";
import useStaff from "@/hooks/useStaff";
import useAddOns from "@/hooks/useAddOns";
import { exportReportExcel, DailyLogTransaction } from "@/lib/dailyLogExport";
import { buildStaffCommissionMatrix } from "@/lib/staffCommissions";
import { formatAppDateTime } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Search,
  Download,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileIcon,
  Banknote,
  Receipt,
  TrendingUp,
  Wallet,
  HandCoins,
  Calendar,
  LucideIcon,
} from "lucide-react";

interface ReportAddOn {
  seller_id?: string | null;
}

interface ReportTransaction {
  id: string;
  order_id?: string;
  vehicle_in?: string | null;
  customer_name?: string | null;
  plate_number?: string | null;
  payment_method?: string | null;
  unpaid_note?: string | null;
  total_price?: number | null;
  status?: string | null;
  services?: { service_name?: string } | { service_name?: string }[] | null;
  transaction_add_ons?: ReportAddOn[];
}

interface ChartPoint {
  date?: string;
  service?: string;
  method?: string;
  name?: string;
  revenue?: number;
  count?: number;
  commission?: number;
}

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

const selectClass =
  "h-10 w-full rounded-md border border-border/80 bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50";

const cardClass =
  "bg-card rounded-xl border border-border/60 shadow-xs overflow-hidden";

const shortDate = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

function SectionCard({
  title,
  description,
  action,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${cardClass} ${className}`}>
      <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5">
        <div>
          <h3 className="font-semibold text-foreground text-base">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  children,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "primary";
  children?: React.ReactNode;
}) {
  return (
    <div className="p-5 bg-card rounded-xl border border-border/60 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
          {label}
        </p>
        <div className="p-2 bg-primary/10 rounded-md text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p
        className={`text-2xl font-bold truncate leading-tight ${
          tone === "primary" ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <div className="min-h-4 text-xs text-muted-foreground">{children}</div>
    </div>
  );
}

export default function AdminReportsPage() {
  const getPresetDates = (preset: string) => {
    const now = new Date();
    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

    const todayObj = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Manila" }),
    );
    const todayStr = formatDate(todayObj);

    if (preset === "today") return { startDate: todayStr, endDate: todayStr };
    if (preset === "yesterday") {
      const y = new Date(todayObj);
      y.setDate(y.getDate() - 1);
      return { startDate: formatDate(y), endDate: formatDate(y) };
    }
    if (preset === "this_week") {
      const day = todayObj.getDay();
      const diffToMon = todayObj.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(todayObj);
      mon.setDate(diffToMon);
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      return { startDate: formatDate(mon), endDate: formatDate(sun) };
    }
    if (preset === "this_month") {
      const first = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);
      const last = new Date(todayObj.getFullYear(), todayObj.getMonth() + 1, 0);
      return { startDate: formatDate(first), endDate: formatDate(last) };
    }
    return { startDate: todayStr, endDate: todayStr };
  };

  const [datePreset, setDatePreset] = useState("this_month");
  const initialDates = getPresetDates("this_month");
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [status, setStatus] = useState("all");
  const [serviceId, setServiceId] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [staffId, setStaffId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const queryClient = useQueryClient();
  const { data: services } = useServices();
  const { data: staffList } = useStaff();
  const { data: addOnsList } = useAddOns();

  const getServiceName = (transaction: ReportTransaction) => {
    const relation = Array.isArray(transaction.services)
      ? transaction.services[0]
      : transaction.services;
    return relation?.service_name || "-";
  };

  const getSellerNames = (transaction: ReportTransaction) => {
    const sellerIds = (transaction.transaction_add_ons || [])
      .map((addOn: { seller_id?: string | null }) => addOn.seller_id)
      .filter((sellerId): sellerId is string => Boolean(sellerId));

    return sellerIds
      .map(
        (sellerId: string) =>
          staffList?.find((staff: { id: string }) => staff.id === sellerId)
            ?.name || "Unknown Seller",
      )
      .filter(
        (name: string, index: number, names: string[]) =>
          names.indexOf(name) === index,
      )
      .join(", ");
  };

  // Refs for capturing the DOM for PDF
  const kpiRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    const range = getPresetDates(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPage(1);
  };

  const filterParams = () =>
    new URLSearchParams({
      startDate,
      endDate,
      status,
      serviceId,
      paymentMethod,
      staffId,
      search,
    });

  const {
    data: reportData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "admin-reports",
      startDate,
      endDate,
      status,
      serviceId,
      paymentMethod,
      staffId,
      search,
      page,
    ],
    queryFn: async () => {
      const params = filterParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      const res = await api.get(`/api/admin/reports?${params.toString()}`);
      return res.data;
    },
  });

  // Every transaction in the range (not paginated): feeds the per-day staff
  // commission table and the exports.
  const allKey = [
    "admin-reports-all",
    startDate,
    endDate,
    status,
    serviceId,
    paymentMethod,
    staffId,
    search,
  ];
  const fetchAllTransactions = async (): Promise<ReportTransaction[]> => {
    const params = filterParams();
    params.set("export", "true");
    const res = await api.get(`/api/admin/reports?${params.toString()}`);
    return res.data.data || [];
  };
  const { data: allTransactions, isLoading: isCommissionLoading } = useQuery({
    queryKey: allKey,
    queryFn: fetchAllTransactions,
  });

  const staffNameById = useMemo(() => {
    const map: Record<string, string> = {};
    (staffList || []).forEach((s: { id: string; name: string }) => {
      map[s.id] = s.name;
    });
    return map;
  }, [staffList]);

  const commissionMatrix = useMemo(
    () =>
      buildStaffCommissionMatrix(
        (allTransactions || []) as unknown as DailyLogTransaction[],
        staffNameById,
        staffId !== "all" ? staffId : undefined,
      ),
    [allTransactions, staffNameById, staffId],
  );

  // Unpaid orders (partnerships etc.): sales with no money collected
  const unpaidSummary = useMemo(() => {
    const unpaid = (allTransactions || []).filter(
      (t) =>
        t.payment_method === "unpaid" &&
        t.status?.toLowerCase() !== "cancelled",
    );
    return {
      count: unpaid.length,
      amount: unpaid.reduce((sum, t) => sum + Number(t.total_price || 0), 0),
    };
  }, [allTransactions]);

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      setIsExporting(true);
      setExportOpen(false);

      const txs = await queryClient.fetchQuery({
        queryKey: allKey,
        queryFn: fetchAllTransactions,
        staleTime: 15_000,
      });

      if (txs.length === 0) {
        alert("No records to export for the selected filters.");
        setIsExporting(false);
        return;
      }

      const headers = [
        "Order ID",
        "Date",
        "Customer",
        "Plate #",
        "Service",
        "Top-Up Seller",
        "Payment",
        "Total (PHP)",
        "Status",
      ];

      const rows: string[][] = txs.map((t) => [
        t.order_id || "",
        formatAppDateTime(t.vehicle_in ?? null),
        t.customer_name || "Guest",
        t.plate_number || "",
        getServiceName(t),
        getSellerNames(t),
        t.payment_method === "unpaid" && t.unpaid_note
          ? `unpaid (${t.unpaid_note})`
          : t.payment_method || "",
        Number(t.total_price || 0).toFixed(2),
        t.status || "",
      ]);

      const fileName = `Car_Wash_Report_${startDate}_to_${endDate}`;

      if (format === "csv") {
        const csvRows = txs.map((t) => [
          t.order_id,
          formatAppDateTime(t.vehicle_in ?? null),
          `"${(t.customer_name || "Guest").replace(/"/g, '""')}"`,
          t.plate_number,
          `"${getServiceName(t).replace(/"/g, '""')}"`,
          `"${getSellerNames(t).replace(/"/g, '""')}"`,
          t.payment_method === "unpaid" && t.unpaid_note
            ? `"unpaid (${t.unpaid_note.replace(/"/g, '""')})"`
            : t.payment_method,
          t.total_price,
          t.status,
        ]);

        const csvContent =
          "data:text/csv;charset=utf-8," +
          [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === "excel") {
        // Daily Log (paper-ledger layout) + Staff Commissions per day + Transactions
        const addOnLabels: Record<string, string> = {};
        (addOnsList || []).forEach((a: { id: string; label: string }) => {
          addOnLabels[a.id] = a.label;
        });

        await exportReportExcel(
          txs as unknown as DailyLogTransaction[],
          { addOnLabels, staffNames: staffNameById },
          startDate,
          endDate,
        );
      } else if (format === "pdf") {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const htmlToImage = await import("html-to-image");

        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        let currentY = 20;

        // Cover / Header
        doc.setFontSize(22);
        doc.setTextColor(37, 99, 235); // Primary Blue
        doc.text("Business Performance Report", 14, currentY);
        currentY += 8;
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(
          `Generated on: ${new Date().toLocaleDateString()}`,
          14,
          currentY,
        );
        currentY += 5;
        doc.text(`Reporting Period: ${startDate} to ${endDate}`, 14, currentY);
        currentY += 15;

        if (kpiRef.current) {
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text("Executive Summary", 14, currentY);
          currentY += 5;

          const imgData = await htmlToImage.toPng(kpiRef.current, {
            pixelRatio: 2,
            backgroundColor: "#ffffff",
          });
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = pageWidth - 28;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          doc.addImage(imgData, "PNG", 14, currentY, pdfWidth, pdfHeight);
          currentY += pdfHeight + 15;
        }

        // Keep the summary and chart snapshots on the first page.
        if (chartsRef.current) {
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text("Analytics & Trends", 14, currentY);
          currentY += 5;

          const imgData = await htmlToImage.toPng(chartsRef.current, {
            pixelRatio: 2,
            backgroundColor: "#ffffff",
          });
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = pageWidth - 28;
          const maxHeight = 125;
          const pdfHeight = Math.min(
            (imgProps.height * pdfWidth) / imgProps.width,
            maxHeight,
          );

          doc.addImage(imgData, "PNG", 14, currentY, pdfWidth, pdfHeight);
          currentY += pdfHeight + 10;
        }

        // Staff commissions (per staff, whole period)
        const exportMatrix = buildStaffCommissionMatrix(
          txs as unknown as DailyLogTransaction[],
          staffNameById,
          staffId !== "all" ? staffId : undefined,
        );
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Staff Commissions", 14, 20);
        autoTable(doc, {
          head: [["Staff", "Orders", "Commission (PHP)"]],
          body: [
            ...exportMatrix.rows.map((r) => [
              r.name,
              String(r.orders),
              r.total.toFixed(2),
            ]),
            [
              "Total",
              String(exportMatrix.rows.reduce((sum, r) => sum + r.orders, 0)),
              exportMatrix.grandTotal.toFixed(2),
            ],
          ],
          startY: 25,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [37, 99, 235] },
        });

        // Detailed table on its own page.
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Detailed Transaction Log", 14, 20);

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 25,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] },
        });

        doc.save(`${fileName}.pdf`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert(`Failed to export. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const kpis = reportData?.kpis || {};
  const charts = reportData?.charts || {};
  const transactions = reportData?.transactions || [];
  const pagination = reportData?.pagination || { page: 1, totalPages: 1 };

  const hasActiveFilters =
    status !== "all" ||
    serviceId !== "all" ||
    paymentMethod !== "all" ||
    staffId !== "all" ||
    search !== "";

  const clearFilters = () => {
    setStatus("all");
    setServiceId("all");
    setPaymentMethod("all");
    setStaffId("all");
    setSearch("");
    setPage(1);
  };

  const peso = (n: number) =>
    `₱${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const statusStyle: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-700",
    pending: "bg-amber-500/10 text-amber-700",
    in_progress: "bg-blue-500/10 text-blue-700",
    cancelled: "bg-rose-500/10 text-rose-700",
  };

  const presets = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "custom", label: "Custom" },
  ];

  const axisTick = { fontSize: 11 };
  const pesoTooltip = (label: string) => (value: unknown) => [
    `₱${Number(value).toLocaleString()}`,
    label,
  ];

  const rangeLabel =
    startDate === endDate
      ? shortDate(startDate)
      : `${shortDate(startDate)} – ${shortDate(endDate)}`;

  return (
    <div className="flex flex-col space-y-6 p-4 sm:p-6 md:p-8 w-full max-w-350 mx-auto overflow-x-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Reports
          </h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {rangeLabel}
            <span className="text-border">•</span>
            Sales, staff commissions and transaction history
          </p>
        </div>

        <Popover open={exportOpen} onOpenChange={setExportOpen}>
          <PopoverTrigger>
            <Button
              variant="default"
              disabled={isExporting}
              className="w-full sm:w-auto shrink-0"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Export
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-60 p-2 bg-card border border-border shadow-lg"
            align="end"
          >
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto justify-start py-2 font-normal"
                onClick={() => handleExport("excel")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="flex flex-col items-start text-left">
                  <span>Excel</span>
                  <span className="text-[11px] text-muted-foreground">
                    Daily log + staff commissions
                  </span>
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto justify-start py-2 font-normal"
                onClick={() => handleExport("pdf")}
              >
                <FileIcon className="mr-2 h-4 w-4 shrink-0 text-rose-600" />
                <span className="flex flex-col items-start text-left">
                  <span>PDF</span>
                  <span className="text-[11px] text-muted-foreground">
                    Summary, charts, commissions
                  </span>
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto justify-start py-2 font-normal"
                onClick={() => handleExport("csv")}
              >
                <FileText className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex flex-col items-start text-left">
                  <span>CSV</span>
                  <span className="text-[11px] text-muted-foreground">
                    Plain transaction list
                  </span>
                </span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border/60 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 w-fit">
            {presets.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePresetChange(p.value)}
                className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
                  datePreset === p.value
                    ? "bg-background text-foreground font-medium shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {datePreset === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="Start date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-10 bg-background"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                aria-label="End date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-10 bg-background"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              aria-label="Search transactions"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search order, customer, plate"
              className="pl-9 bg-background border-border/80 h-10 w-full"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            aria-label="Filter by service"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All services</option>
            {(services || []).map(
              (service: { id: string; service_name: string }) => (
                <option key={service.id} value={service.id}>
                  {service.service_name}
                </option>
              ),
            )}
          </select>

          <select
            aria-label="Filter by payment method"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All payments</option>
            <option value="cash">Cash</option>
            <option value="qr">QR</option>
            <option value="card">Card</option>
            <option value="unpaid">Unpaid</option>
          </select>

          <select
            aria-label="Filter by staff member"
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All staff</option>
            {(staffList || []).map((staff: { id: string; name: string }) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="mr-1 h-4 w-4" /> Clear filters
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24 w-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-destructive w-full">
          Failed to load reports data.
        </div>
      ) : (
        <>
          {/* Summary (PDF snapshot) */}
          <div
            ref={kpiRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-background p-2 -m-2 rounded-lg"
          >
            <StatCard
              label="Revenue"
              value={peso(kpis.totalRevenue)}
              icon={Banknote}
              tone="primary"
            >
              Completed orders only
            </StatCard>
            <StatCard
              label="Transactions"
              value={String(kpis.transactionCount || 0)}
              icon={Receipt}
            >
              <span className="flex flex-wrap gap-x-3">
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 size={12} /> {kpis.completedCount || 0} done
                </span>
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <Clock size={12} /> {kpis.pendingInProgressCount || 0} open
                </span>
                <span className="inline-flex items-center gap-1 text-rose-600">
                  <XCircle size={12} /> {kpis.cancelledCount || 0} cancelled
                </span>
              </span>
            </StatCard>
            <StatCard
              label="Avg. Ticket"
              value={peso(kpis.averageTicket)}
              icon={TrendingUp}
            >
              Per completed order
            </StatCard>
            <StatCard
              label="Commissions"
              value={peso(kpis.totalCommissions)}
              icon={Wallet}
            >
              Paid out to staff
            </StatCard>
            <StatCard
              label="Unpaid"
              value={peso(unpaidSummary.amount)}
              icon={HandCoins}
            >
              {unpaidSummary.count} order{unpaidSummary.count === 1 ? "" : "s"}{" "}
              not yet collected
            </StatCard>
          </div>

          {/* Charts (PDF snapshot) */}
          <div
            ref={chartsRef}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full bg-background p-2 -m-2 rounded-lg"
          >
            <SectionCard
              title="Revenue by Day"
              className="lg:col-span-3"
              description="Completed orders per day"
            >
              <div className="h-65 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={charts.revenueByDay || []}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="text-border/40"
                    />
                    <XAxis
                      dataKey="date"
                      tick={axisTick}
                      tickFormatter={shortDate}
                    />
                    <YAxis tick={axisTick} />
                    <Tooltip
                      formatter={pesoTooltip("Revenue")}
                      labelFormatter={(label) => shortDate(String(label))}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              title="Revenue by Service"
              className="lg:col-span-2"
            >
              <div className="h-65 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.revenueByService || []}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="text-border/40"
                    />
                    <XAxis dataKey="service" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip formatter={pesoTooltip("Revenue")} />
                    <Bar
                      dataKey="revenue"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Payment Methods">
              <div className="h-65 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.paymentMethodBreakdown || []}
                      dataKey="count"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      isAnimationActive={false}
                    >
                      {(charts.paymentMethodBreakdown || []).map(
                        (_entry: ChartPoint, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          {/* Staff commissions per day + top-up sales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard
              title="Staff Commissions"
              description="Earned per day, from completed orders"
              className="lg:col-span-2"
              action={
                <div className="text-right shrink-0">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Total
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {peso(commissionMatrix.grandTotal)}
                  </p>
                </div>
              }
            >
              {isCommissionLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : commissionMatrix.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No commissions for this period.
                </p>
              ) : (
                <div className="-mx-4 sm:-mx-5 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                      <tr>
                        <th className="sticky left-0 z-10 bg-muted px-4 py-3 min-w-36">
                          Staff
                        </th>
                        {commissionMatrix.dates.map((d) => (
                          <th
                            key={d}
                            className="px-3 py-3 text-right whitespace-nowrap"
                          >
                            {shortDate(d)}
                          </th>
                        ))}
                        <th className="px-3 py-3 text-right">Orders</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {commissionMatrix.rows.map((r) => (
                        <tr key={r.staffId} className="hover:bg-muted/20">
                          <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium whitespace-nowrap">
                            {r.name}
                          </td>
                          {commissionMatrix.dates.map((d) => (
                            <td
                              key={d}
                              className="px-3 py-2.5 text-right tabular-nums text-muted-foreground"
                            >
                              {r.perDay[d] ? peso(r.perDay[d]) : "–"}
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {r.orders}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap">
                            {peso(r.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/40 font-semibold">
                      <tr>
                        <td className="sticky left-0 z-10 bg-muted px-4 py-3">
                          Total
                        </td>
                        {commissionMatrix.dates.map((d) => (
                          <td
                            key={d}
                            className="px-3 py-3 text-right tabular-nums"
                          >
                            {peso(commissionMatrix.dayTotals[d] || 0)}
                          </td>
                        ))}
                        <td className="px-3 py-3 text-right tabular-nums">
                          {commissionMatrix.rows.reduce(
                            (sum, r) => sum + r.orders,
                            0,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                          {peso(commissionMatrix.grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Top-Up Sales"
              description="Add-ons sold by staff"
            >
              {(charts.topUpSellerSummary || []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No top-up sales for this period.
                </p>
              ) : (
                <div>
                  {(charts.topUpSellerSummary || []).map(
                    (seller: {
                      name: string;
                      count: number;
                      revenue: number;
                    }) => (
                      <div
                        key={seller.name}
                        className="flex items-center justify-between gap-3 border-b border-border/50 py-2.5 last:border-0 text-sm"
                      >
                        <div>
                          <p className="font-medium">{seller.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {seller.count} add-on{seller.count === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span className="font-semibold tabular-nums">
                          {peso(seller.revenue)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Transactions */}
          <section className={`${cardClass} w-full flex flex-col`}>
            <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                Transactions
              </h3>
              <p className="text-xs text-muted-foreground">
                {pagination.totalCount ?? transactions.length} total
              </p>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left min-w-190">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Top-Up Seller</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        No transactions match these filters.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t: ReportTransaction) => (
                      <tr
                        key={t.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {t.order_id}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {t.vehicle_in
                            ? new Date(t.vehicle_in).toLocaleDateString(
                                "en-PH",
                                {
                                  timeZone: "Asia/Manila",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {t.customer_name || "Guest"}
                          </div>
                          {t.plate_number && (
                            <div className="text-xs text-muted-foreground">
                              {t.plate_number}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">{getServiceName(t)}</td>
                        <td className="px-4 py-3">
                          {getSellerNames(t) || "-"}
                        </td>
                        <td className="px-4 py-3 uppercase text-xs">
                          {t.payment_method === "unpaid" ? (
                            <div className="normal-case">
                              <span className="inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
                                Unpaid
                              </span>
                              {t.unpaid_note && (
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                  {t.unpaid_note}
                                </div>
                              )}
                            </div>
                          ) : (
                            t.payment_method || "-"
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                          {peso(Number(t.total_price || 0))}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              statusStyle[t.status || ""] ||
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {(t.status || "-").replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border/60 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
