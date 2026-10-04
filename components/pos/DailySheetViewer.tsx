"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, ImageDown, Loader2, Sheet } from "lucide-react";
import { api } from "@/lib/api";
import { getAppDate } from "@/lib/date";
import {
  buildDaySheetModel,
  CASH_DENOMINATIONS,
  DailyLogTransaction,
  exportReportExcel,
} from "@/lib/dailyLogExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddOnsData } from "@/types/AddOnsData";
import { StaffData } from "@/types/StaffData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addOns: AddOnsData[];
  staffList: StaffData[];
}

const MIN_VISIBLE_ROWS = 18;

const money = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
// Blank instead of 0.00 inside the grid, like the paper sheet
const cell = (n: number) => (n ? money(n) : "");

const th =
  "border border-neutral-300 bg-neutral-100 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-700";
const td = "border border-neutral-200 px-2 py-1 text-xs";

export default function DailySheetViewer({
  open,
  onOpenChange,
  addOns,
  staffList,
}: Props) {
  const today = getAppDate();
  const [date, setDate] = useState(today);
  const [openingCashier, setOpeningCashier] = useState("");
  const [closingCashier, setClosingCashier] = useState("");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [expenses, setExpenses] = useState("");
  const [marketing, setMarketing] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    // under "transactions" so the existing realtime hook refreshes it live
    queryKey: ["transactions", "daily-sheet", date],
    queryFn: async () => {
      const res = await api.get("/api/pos/daily-sheet", { params: { date } });
      return res.data as {
        date: string;
        data: DailyLogTransaction[];
        openCount: number;
      };
    },
    enabled: open,
  });

  const lookups = useMemo(() => {
    const addOnLabels: Record<string, string> = {};
    addOns.forEach((a) => {
      addOnLabels[a.id] = a.label;
    });
    const staffNames: Record<string, string> = {};
    staffList.forEach((s) => {
      staffNames[s.id] = s.name;
    });
    return { addOnLabels, staffNames };
  }, [addOns, staffList]);

  const model = useMemo(
    () => buildDaySheetModel(date, data?.data || [], lookups),
    [date, data, lookups],
  );

  // Cash count and the two hand-typed boxes (the grey cells on the paper sheet)
  const cashRows = CASH_DENOMINATIONS.map((den) => {
    const q = Number(qty[String(den)]) || 0;
    return { den, q, total: Math.round(q * den * 100) / 100 };
  });
  const coh = cashRows.reduce((sum, r) => sum + r.total, 0);
  const expensesNum = Number(expenses) || 0;
  const marketingNum = Number(marketing) || 0;
  const posReading = model.summary.posReading + marketingNum;
  const grossSales = posReading - model.summary.staffCF;
  // marketing is added to POS reading and subtracted again, so it nets out
  const netCash = model.summary.netCash - expensesNum;
  const shortOver = coh - netCash;

  const blankRows = Math.max(0, MIN_VISIBLE_ROWS - model.ledger.length);

  const saveImage = async () => {
    if (!sheetRef.current) return;
    try {
      setIsExporting(true);
      const htmlToImage = await import("html-to-image");
      const url = await htmlToImage.toPng(sheetRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = `Daily_Sheet_${date}.png`;
      link.click();
    } catch (error) {
      console.error("Failed to save daily sheet image:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportExcel = async () => {
    try {
      setIsExporting(true);
      await exportReportExcel(data?.data || [], lookups, date, date);
    } catch (error) {
      console.error("Failed to export daily sheet:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const hasRows = model.ledger.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] w-[96vw] overflow-y-auto sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sheet className="h-5 w-5 text-primary" />
            Daily Sheet
          </DialogTitle>
          <DialogDescription>
            Today&apos;s completed orders in the sheet format. Take a screenshot,
            save it as an image, or export it to Excel.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar (not part of the screenshot area) */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Sheet date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="h-10 w-44"
            />
            {date !== today && (
              <Button variant="outline" onClick={() => setDate(today)}>
                Today
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={saveImage}
              disabled={isExporting || isLoading}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageDown className="mr-2 h-4 w-4" />
              )}
              Save as image
            </Button>
            <Button
              onClick={exportExcel}
              disabled={isExporting || isLoading || !hasRows}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {(data?.openCount ?? 0) > 0 && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-500">
            {data?.openCount} order{data?.openCount === 1 ? " is" : "s are"} still
            in the queue and will show here once marked completed.
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading sheet...
          </div>
        ) : isError ? (
          <p className="py-16 text-center text-sm text-red-600">
            Could not load the sheet. Please try again.
          </p>
        ) : (
          <div className="overflow-x-auto">
            {/* Screenshot area: always light, like the paper sheet */}
            <div
              ref={sheetRef}
              className="min-w-[980px] space-y-4 bg-white p-5 text-neutral-900"
            >
              {/* Header */}
              <div className="flex items-end justify-between gap-4 border-b-2 border-neutral-800 pb-3">
                <div>
                  <p className="text-2xl font-extrabold tracking-tight">
                    HERO CARWASH
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Daily Sheet
                  </p>
                </div>
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-xs">
                  <span className="font-bold">DATE:</span>
                  <span className="font-semibold">{model.prettyDate}</span>
                  <span className="font-bold">OPENING CASHIER</span>
                  <input
                    value={openingCashier}
                    onChange={(e) => setOpeningCashier(e.target.value)}
                    className="border-b border-neutral-400 bg-transparent px-1 outline-none"
                    aria-label="Opening cashier"
                  />
                  <span className="font-bold">CLOSING CASHIER</span>
                  <input
                    value={closingCashier}
                    onChange={(e) => setClosingCashier(e.target.value)}
                    className="border-b border-neutral-400 bg-transparent px-1 outline-none"
                    aria-label="Closing cashier"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[250px_1fr] gap-5">
                {/* Left: cash breakdown + summary */}
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase">
                      Cash Breakdown
                    </p>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className={th}>Qty</th>
                          <th className={th}>Denom.</th>
                          <th className={`${th} text-right`}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashRows.map((r) => (
                          <tr key={r.den}>
                            <td className={td}>
                              <input
                                inputMode="numeric"
                                value={qty[String(r.den)] ?? ""}
                                onChange={(e) =>
                                  setQty((prev) => ({
                                    ...prev,
                                    [String(r.den)]: e.target.value.replace(
                                      /[^0-9]/g,
                                      "",
                                    ),
                                  }))
                                }
                                aria-label={`Quantity of ${r.den} peso`}
                                className="w-12 bg-neutral-100 px-1 text-center outline-none focus:bg-yellow-50"
                              />
                            </td>
                            <td className={`${td} text-right`}>{r.den}</td>
                            <td className={`${td} text-right`}>
                              {cell(r.total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td className={td} colSpan={2}>
                            TOTAL
                          </td>
                          <td className={`${td} text-right`}>{money(coh)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase">
                      Summary Report
                    </p>
                    <table className="w-full border-collapse">
                      <tbody>
                        {[
                          ["GROSS SALES", money(grossSales)],
                          ["STAFF CF", money(model.summary.staffCF)],
                          ["POS READING", money(posReading)],
                        ].map(([label, value]) => (
                          <tr key={label}>
                            <td className={`${td} font-semibold`}>{label}</td>
                            <td className={`${td} text-right`}>{value}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className={`${td} font-semibold`}>EXPENSES</td>
                          <td className={`${td} text-right`}>
                            <input
                              inputMode="decimal"
                              value={expenses}
                              onChange={(e) =>
                                setExpenses(
                                  e.target.value.replace(/[^0-9.]/g, ""),
                                )
                              }
                              aria-label="Expenses"
                              placeholder="0.00"
                              className="w-20 bg-neutral-100 px-1 text-right outline-none focus:bg-yellow-50"
                            />
                          </td>
                        </tr>
                        <tr className="bg-amber-50">
                          <td className={`${td} font-semibold`}>UNPAIDS</td>
                          <td className={`${td} text-right`}>
                            {money(model.summary.unpaids)}
                          </td>
                        </tr>
                        <tr>
                          <td className={`${td} font-semibold`}>DISCOUNTS</td>
                          <td className={`${td} text-right`}>
                            {money(model.summary.discounts)}
                          </td>
                        </tr>
                        <tr>
                          <td className={`${td} font-semibold`}>
                            MARKETING EXPENSE
                          </td>
                          <td className={`${td} text-right`}>
                            <input
                              inputMode="decimal"
                              value={marketing}
                              onChange={(e) =>
                                setMarketing(
                                  e.target.value.replace(/[^0-9.]/g, ""),
                                )
                              }
                              aria-label="Marketing expense"
                              placeholder="0.00"
                              className="w-20 bg-neutral-100 px-1 text-right outline-none focus:bg-yellow-50"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className={`${td} font-semibold`}>
                            QR/PALAWAN PAY
                          </td>
                          <td className={`${td} text-right`}>
                            {money(model.summary.qr)}
                          </td>
                        </tr>
                        <tr>
                          <td className={`${td} font-semibold`}>
                            CARD PAYMENTS
                          </td>
                          <td className={`${td} text-right`}>
                            {money(model.summary.card)}
                          </td>
                        </tr>
                        <tr className="bg-neutral-100 font-bold">
                          <td className={td}>Net Cash</td>
                          <td className={`${td} text-right`}>
                            {money(netCash)}
                          </td>
                        </tr>
                        <tr className="font-bold">
                          <td className={td}>COH (Cash on Hand)</td>
                          <td className={`${td} text-right`}>{money(coh)}</td>
                        </tr>
                        <tr
                          className={`font-bold ${
                            Math.abs(shortOver) < 0.005
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          <td className={td}>(Short)/Over</td>
                          <td className={`${td} text-right`}>
                            {shortOver < -0.004
                              ? `(${money(Math.abs(shortOver))})`
                              : money(shortOver)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: ledger + unpaids */}
                <div className="min-w-0 space-y-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={th}>No.</th>
                        <th className={th}>Plate No.</th>
                        <th className={th}>Services</th>
                        <th className={th}>Staff</th>
                        <th className={`${th} text-right`}>Price</th>
                        <th className={`${th} text-right`}>Discount</th>
                        <th className={`${th} text-right`}>Comm. 25%</th>
                        <th className={`${th} text-right`}>Net Sales</th>
                        <th className={th}>MOP</th>
                        <th className={th}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.ledger.map((row) => (
                        <tr
                          key={row.no}
                          className={
                            row.mop === "UNPAID" ? "bg-amber-50" : undefined
                          }
                        >
                          <td className={`${td} text-center`}>{row.no}</td>
                          <td className={`${td} font-mono uppercase`}>
                            {row.plate}
                          </td>
                          <td className={td}>{row.service}</td>
                          <td className={td}>{row.staff}</td>
                          <td className={`${td} text-right`}>
                            {cell(row.price)}
                          </td>
                          <td className={`${td} text-right`}>
                            {cell(row.discount)}
                          </td>
                          <td className={`${td} text-right`}>
                            {cell(row.commission)}
                          </td>
                          <td className={`${td} text-right`}>{cell(row.net)}</td>
                          <td
                            className={`${td} font-semibold ${
                              row.mop === "UNPAID" ? "text-amber-700" : ""
                            }`}
                          >
                            {row.mop}
                          </td>
                          <td className={td}>{row.remarks}</td>
                        </tr>
                      ))}
                      {Array.from({ length: blankRows }).map((_, i) => (
                        <tr key={`blank-${i}`}>
                          <td className={`${td} text-center text-neutral-400`}>
                            {model.ledger.length + i + 1}
                          </td>
                          {Array.from({ length: 9 }).map((__, j) => (
                            <td key={j} className={td}>
                              &nbsp;
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-neutral-100 font-bold">
                        <td className={td} colSpan={4}>
                          TOTAL
                        </td>
                        <td className={`${td} text-right`}>
                          {money(model.totals.price)}
                        </td>
                        <td className={`${td} text-right`}>
                          {money(model.totals.discount)}
                        </td>
                        <td className={`${td} text-right`}>
                          {money(model.totals.commission)}
                        </td>
                        <td className={`${td} text-right`}>
                          {money(model.totals.net)}
                        </td>
                        <td className={td} colSpan={2} />
                      </tr>
                    </tbody>
                  </table>

                  <div>
                    <p className="mb-1 text-xs font-bold uppercase">
                      Unpaids (not collected)
                    </p>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className={`${th} w-8`}>•</th>
                          <th className={th}>Particular</th>
                          <th className={`${th} text-right`}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {model.unpaids.length === 0 ? (
                          <tr>
                            <td
                              className={`${td} text-center text-neutral-400`}
                              colSpan={3}
                            >
                              No unpaid orders
                            </td>
                          </tr>
                        ) : (
                          model.unpaids.map((u, i) => (
                            <tr key={i} className="bg-amber-50">
                              <td className={`${td} text-center`}>•</td>
                              <td className={td}>{u.particular}</td>
                              <td className={`${td} text-right`}>
                                {money(u.amount)}
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="font-bold">
                          <td className={td} colSpan={2}>
                            TOTAL
                          </td>
                          <td className={`${td} text-right`}>
                            {money(model.summary.unpaids)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
