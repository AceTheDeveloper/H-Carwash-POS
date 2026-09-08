"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import useServices from "@/hooks/useServices";
import useStaff from "@/hooks/useStaff";
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
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileIcon,
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [status, setStatus] = useState("all");
  const [serviceId, setServiceId] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [staffId, setStaffId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data: services } = useServices();
  const { data: staffList } = useStaff();

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
    if (preset === "custom") {
      setCalendarOpen(true);
      return;
    }
    if (preset !== "custom") {
      const range = getPresetDates(preset);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
      setPage(1);
    }
  };

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
      const params = new URLSearchParams({
        startDate,
        endDate,
        status,
        serviceId,
        paymentMethod,
        staffId,
        search,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const res = await api.get(`/api/admin/reports?${params.toString()}`);
      return res.data;
    },
  });

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      setIsExporting(true);
      setExportOpen(false);

      const params = new URLSearchParams({
        startDate,
        endDate,
        status,
        serviceId,
        paymentMethod,
        staffId,
        search,
        export: "true",
      });
      const res = await api.get(`/api/admin/reports?${params.toString()}`);
      const txs: ReportTransaction[] = res.data.data || [];

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

      const rows: string[][] = (txs as ReportTransaction[]).map((t) => [
        t.order_id || "",
        t.vehicle_in
          ? new Date(t.vehicle_in).toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
            })
          : "",
        t.customer_name || "Guest",
        t.plate_number || "",
        getServiceName(t),
        getSellerNames(t),
        t.payment_method || "",
        Number(t.total_price || 0).toFixed(2),
        t.status || "",
      ]);

      const fileName = `Car_Wash_Report_${startDate}_to_${endDate}`;

      if (format === "csv") {
        const csvRows = (txs as ReportTransaction[]).map((t) => [
          t.order_id,
          t.vehicle_in
            ? new Date(t.vehicle_in).toLocaleString("en-PH", {
                timeZone: "Asia/Manila",
              })
            : "",
          `"${(t.customer_name || "Guest").replace(/"/g, '""')}"`,
          t.plate_number,
          `"${getServiceName(t).replace(/"/g, '""')}"`,
          `"${getSellerNames(t).replace(/"/g, '""')}"`,
          t.payment_method,
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
        const { utils, writeFile } = await import("xlsx");
        const worksheet = utils.aoa_to_sheet([headers, ...rows]);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Reports");
        writeFile(workbook, `${fileName}.xlsx`);
      } else if (format === "pdf") {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        // Import html-to-image dynamically
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

        // Capture KPIs
        if (kpiRef.current) {
          doc.setFontSize(14);
          doc.setTextColor(0);
          doc.text("Executive Summary", 14, currentY);
          currentY += 5;

          // Use htmlToImage instead of html2canvas
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

          // Use htmlToImage instead of html2canvas
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

        // Keep the detailed table on the second page.
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

  return (
    <div className="flex flex-col space-y-6 p-4 sm:p-6 md:p-8 w-full max-w-[1600px] mx-auto overflow-x-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground break-words">
            Admin Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Comprehensive sales performance, visit metrics, commissions, and
            transaction logs.
          </p>
        </div>

        {/* Export Dropdown */}
        <Popover open={exportOpen} onOpenChange={setExportOpen}>
          <PopoverTrigger>
            <Button
              variant="default"
              disabled={isExporting}
              className="w-full sm:w-auto shadow-xs shrink-0"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Export Report
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-2 bg-card border border-border shadow-lg"
            align="end"
          >
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => handleExport("csv")}
              >
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
                Export as CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => handleExport("excel")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />{" "}
                Export as Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => handleExport("pdf")}
              >
                <FileIcon className="mr-2 h-4 w-4 text-rose-600" /> Export as
                PDF (Full)
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Filter Toolbar (Omitted unchanged code for brevity, keep your exact filter bar here) */}
      <div className="bg-card p-4 sm:p-5 rounded-xl border border-border/60 shadow-xs flex flex-col gap-4 w-full">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4 w-full">
          {/* Search Bar */}
          <div className="flex flex-col gap-1.5 w-full lg:max-w-md">
            <label
              htmlFor="search-input"
              className="text-xs font-semibold text-muted-foreground"
            >
              Search Transactions
            </label>
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                id="search-input"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search Order ID, Customer, Plate..."
                className="pl-9 bg-background border-border/80 h-10 w-full"
              />
            </div>
          </div>

          {/* Date Presets & Custom Date Range */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto">
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <label
                htmlFor="preset-select"
                className="text-xs font-semibold text-muted-foreground"
              >
                Date Preset
              </label>
              <select
                id="preset-select"
                value={datePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className={`${selectClass} sm:w-[160px]`}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <label className="text-xs font-semibold text-muted-foreground">
                Custom Range
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    className="h-10 bg-background border-border/80 justify-start text-left font-normal px-3 w-full sm:w-auto"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {startDate && endDate
                        ? `${startDate} to ${endDate}`
                        : "Pick date range"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[calc(100vw-2rem)] sm:w-auto p-4 bg-card border border-border shadow-lg max-w-sm"
                  align="end"
                >
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-semibold mb-1 block text-muted-foreground">
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setDatePreset("custom");
                            setPage(1);
                          }}
                          className="h-10 bg-background w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold mb-1 block text-muted-foreground">
                          End Date
                        </label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setDatePreset("custom");
                            setPage(1);
                          }}
                          className="h-10 bg-background w-full"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => setCalendarOpen(false)}
                    >
                      Apply Range
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
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
            onChange={(event) => {
              setServiceId(event.target.value);
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
            onChange={(event) => {
              setPaymentMethod(event.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="all">All payment methods</option>
            <option value="cash">Cash</option>
            <option value="qr">QR</option>
          </select>

          <select
            aria-label="Filter by staff member"
            value={staffId}
            onChange={(event) => {
              setStaffId(event.target.value);
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
          {/* WRAPPED IN kpiRef FOR PDF SNAPSHOT */}
          <div
            ref={kpiRef}
            className="flex flex-col gap-4 bg-background p-2 -m-2 rounded-lg"
          >
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              <div className="p-5 bg-card rounded-xl border border-border shadow-xs space-y-1">
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-primary truncate">
                  ₱
                  {(kpis.totalRevenue || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="p-5 bg-card rounded-xl border border-border shadow-xs space-y-1">
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {kpis.transactionCount || 0}
                </p>
              </div>
              <div className="p-5 bg-card rounded-xl border border-border shadow-xs space-y-1">
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  Average Ticket Value
                </p>
                <p className="text-2xl font-bold text-foreground truncate">
                  ₱
                  {(kpis.averageTicket || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="p-5 bg-card rounded-xl border border-border shadow-xs space-y-1">
                <p className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                  Total Commissions
                </p>
                <p className="text-2xl font-bold text-primary truncate">
                  ₱
                  {(kpis.totalCommissions || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="p-4 bg-card rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Completed
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    {kpis.completedCount || 0}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500/20" />
              </div>
              <div className="p-4 bg-card rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Pending / In-Progress
                  </p>
                  <p className="text-xl font-bold text-amber-600">
                    {kpis.pendingInProgressCount || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-amber-500/20" />
              </div>
              <div className="p-4 bg-card rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Cancelled
                  </p>
                  <p className="text-xl font-bold text-rose-600">
                    {kpis.cancelledCount || 0}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-rose-500/20" />
              </div>
            </div>
          </div>

          {/* WRAPPED IN chartsRef FOR PDF SNAPSHOT */}
          <div
            ref={chartsRef}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full bg-background p-2 -m-2 rounded-lg"
          >
            {/* Revenue by Day */}
            <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-xs space-y-4">
              <h3 className="font-semibold text-foreground text-base">
                Revenue by Day
              </h3>
              <div className="h-[280px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={charts.revenueByDay || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="text-border/40"
                    />
                    <XAxis
                      dataKey="date"
                      className="text-muted-foreground text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      className="text-muted-foreground text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [
                        `₱${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    {/* Notice isAnimationActive={false} to ensure perfect snapshots */}
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by Service */}
            <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-xs space-y-4">
              <h3 className="font-semibold text-foreground text-base">
                Revenue by Service
              </h3>
              <div className="h-[280px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.revenueByService || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="text-border/40"
                    />
                    <XAxis
                      dataKey="service"
                      className="text-muted-foreground text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      className="text-muted-foreground text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [
                        `₱${Number(value).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-xs space-y-4">
              <h3 className="font-semibold text-foreground text-base">
                Payment Methods
              </h3>
              <div className="h-[280px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.paymentMethodBreakdown || []}
                      dataKey="count"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      isAnimationActive={false}
                    >
                      {(charts.paymentMethodBreakdown || []).map(
                        (entry: ChartPoint, index: number) => (
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
            </div>

            {/* Staff Commission */}
            <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-xs space-y-4">
              <h3 className="font-semibold text-foreground text-base">
                Staff Commissions
              </h3>
              <div className="h-[280px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.staffCommissionSummary || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="text-border/40"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-muted-foreground text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      className="text-muted-foreground text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [
                        `₱${Number(value).toLocaleString()}`,
                        "Commission",
                      ]}
                    />
                    <Bar
                      dataKey="commission"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top-up Seller Performance */}
            <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-xs space-y-4">
              <h3 className="font-semibold text-foreground text-base">
                Top-Up Seller Performance
              </h3>
              <div className="space-y-3">
                {(charts.topUpSellerSummary || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No top-up seller activity for this period.
                  </p>
                ) : (
                  (charts.topUpSellerSummary || []).map(
                    (seller: {
                      name: string;
                      count: number;
                      revenue: number;
                    }) => (
                      <div
                        key={seller.name}
                        className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0"
                      >
                        <span className="font-medium text-foreground">
                          {seller.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {seller.count} add-ons / ₱
                          {seller.revenue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-card rounded-xl border border-border shadow-xs w-full overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-border/60">
              <h3 className="text-lg font-semibold text-foreground">
                Transaction Log
              </h3>
            </div>
            <div className="w-full overflow-x-auto block whitespace-nowrap">
              <table className="w-full text-sm text-left min-w-[800px]">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Top-Up Seller</th>
                    <th className="px-4 py-3">Total (₱)</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions.map((t: ReportTransaction) => (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {t.order_id}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {t.vehicle_in
                          ? new Date(t.vehicle_in).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {t.customer_name}
                      </td>
                      <td className="px-4 py-3">{getServiceName(t)}</td>
                      <td className="px-4 py-3">{getSellerNames(t) || "-"}</td>
                      <td className="px-4 py-3 font-semibold">
                        ₱{Number(t.total_price || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 capitalize">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
          </div>
        </>
      )}
    </div>
  );
}
