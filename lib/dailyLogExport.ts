// lib/dailyLogExport.ts
//
// Builds the Excel report workbook in the client's own daily-sheet format
// (see spreadsheets/FOR CARWASH SYSTEM OF MR ERWIN.xlsx):
//
//  * one sheet per day, named after the day (like their "30" sheet), laid out as
//    DATE / cashiers, Cash Breakdown, the ledger
//    (NO. | PLATE NO. | SERVICES | STAFF | PRICE | DISCOUNT 10% | COMMISSION FEE 25% |
//     NET SALES | MOP | REMARKS), the SUMMARY REPORT, and the EXPENSES / UNPAIDS /
//    MARKETING tables. Totals and the summary are real Excel formulas, so the
//    cashier can fill in cash counts, expenses and marketing and everything
//    recalculates, exactly like the paper sheet.
//  * "Staff Commissions": commission earned per staff member per day
//  * "Unpaids": every unpaid / settled-unpaid order (partnerships etc.)
//  * "Transactions": one row per order
//
// Only completed orders are on the daily sheets (cancelled / unfinished ones are
// not sales). Unpaid orders ARE on the ledger (they are still washed, and still
// earn commission) with MOP "UNPAID", and are listed in the UNPAIDS table so the
// Net Cash formula subtracts them, because no money was collected.

import type { CellObject, WorkSheet } from "xlsx";
import { getAppDate, formatAppDateTime } from "@/lib/date";
import { buildStaffCommissionMatrix } from "@/lib/staffCommissions";

const COMMISSION_RATE = 0.25;
const MIN_LEDGER_ROWS = 45;
const MIN_TABLE_ROWS = 16;
const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25, 0.1, 0.05];

export interface DailyLogStaffRow {
  staff_id?: string | null;
  commission_amount?: number | null;
  staffs?:
    | { id?: string; name?: string }
    | { id?: string; name?: string }[]
    | null;
}

export interface DailyLogAddOn {
  add_on_id?: string | null;
  price?: number | null;
  seller_id?: string | null;
}

export interface DailyLogTransaction {
  order_id?: string | null;
  vehicle_in?: string | null;
  customer_name?: string | null;
  status?: string | null;
  plate_number?: string | null;
  service_price?: number | null;
  total_price?: number | null;
  payment_method?: string | null;
  unpaid_note?: string | null;
  paid_at?: string | null;
  services?: { service_name?: string } | { service_name?: string }[] | null;
  transaction_add_ons?: DailyLogAddOn[] | null;
  transaction_staff?: DailyLogStaffRow[] | null;
}

export interface DailyLogLookups {
  /** add_on_id -> display label (from useAddOns()) */
  addOnLabels: Record<string, string>;
  /** staff_id -> display name (from useStaff()) */
  staffNames: Record<string, string>;
}

interface LedgerRow {
  plate: string;
  service: string;
  staff: string;
  price: number;
  discount: number;
  mop: string;
  remarks: string;
}

interface UnpaidEntry {
  particular: string;
  amount: number;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function isCompleted(t: DailyLogTransaction) {
  return t.status?.toLowerCase() === "completed";
}

function isUnpaid(t: DailyLogTransaction) {
  return t.payment_method === "unpaid";
}

function getMainStaffNames(
  t: DailyLogTransaction,
  lookups: DailyLogLookups,
): string[] {
  const rows = t.transaction_staff || [];
  const names = rows.map((r) => {
    const rel = Array.isArray(r.staffs) ? r.staffs[0] : r.staffs;
    return (
      rel?.name ||
      (r.staff_id ? lookups.staffNames[r.staff_id] : undefined) ||
      "Unknown"
    );
  });
  return Array.from(new Set(names.filter(Boolean)));
}

/** One ledger line for the service, then one per add-on (own commission each). */
function buildLedgerRows(
  transactions: DailyLogTransaction[],
  lookups: DailyLogLookups,
): LedgerRow[] {
  const rows: LedgerRow[] = [];

  for (const t of transactions) {
    const plate = t.plate_number || "";
    const unpaid = isUnpaid(t);
    const mop = unpaid ? "UNPAID" : (t.payment_method || "").toUpperCase();
    const remarks = unpaid ? "UNPAID" : "";
    const addOns = t.transaction_add_ons || [];
    const addOnsTotal = addOns.reduce(
      (sum, a) => sum + Number(a.price || 0),
      0,
    );
    const servicePrice = Number(t.service_price || 0);
    const subtotal = servicePrice + addOnsTotal;
    // Whatever the promo/discount shaved off the total, shown on the service line.
    const totalDiscount = Math.max(
      0,
      subtotal - Number(t.total_price ?? subtotal),
    );

    const mainStaff = getMainStaffNames(t, lookups).join("/") || "-";
    const serviceRel = Array.isArray(t.services) ? t.services[0] : t.services;

    rows.push({
      plate,
      service: serviceRel?.service_name || "-",
      staff: mainStaff,
      price: round2(servicePrice),
      discount: round2(totalDiscount),
      mop,
      remarks,
    });

    for (const addOn of addOns) {
      rows.push({
        plate,
        service:
          (addOn.add_on_id && lookups.addOnLabels[addOn.add_on_id]) || "Add-on",
        staff: addOn.seller_id
          ? lookups.staffNames[addOn.seller_id] || "Unknown"
          : mainStaff,
        price: round2(Number(addOn.price || 0)),
        discount: 0,
        mop,
        remarks,
      });
    }
  }

  return rows;
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

export interface DaySheetLedgerRow extends LedgerRow {
  no: number;
  commission: number;
  net: number;
}

export interface DaySheetModel {
  date: string;
  prettyDate: string;
  ledger: DaySheetLedgerRow[];
  unpaids: UnpaidEntry[];
  totals: { price: number; discount: number; commission: number; net: number };
  summary: {
    grossSales: number;
    staffCF: number;
    posReading: number;
    unpaids: number;
    discounts: number;
    qr: number;
    card: number;
    /** POS reading - unpaids - discounts - QR - card (expenses / marketing are typed in by hand) */
    netCash: number;
  };
}

export const CASH_DENOMINATIONS = DENOMINATIONS;

/**
 * Everything on one daily sheet, calculated once, so the in-app sheet viewer
 * and the Excel file always show the same numbers.
 */
export function buildDaySheetModel(
  date: string,
  transactions: DailyLogTransaction[],
  lookups: DailyLogLookups,
): DaySheetModel {
  const unpaids: UnpaidEntry[] = transactions.filter(isUnpaid).map((t) => ({
    particular: [t.plate_number, t.unpaid_note].filter(Boolean).join(" - "),
    amount: round2(Number(t.total_price || 0)),
  }));

  let price = 0;
  let discount = 0;
  let commissionTotal = 0;
  let net = 0;
  let qr = 0;
  let card = 0;

  const ledger = buildLedgerRows(transactions, lookups).map((row, i) => {
    const commission = round2((row.price - row.discount) * COMMISSION_RATE);
    const rowNet = round2(row.price - commission);
    price += row.price;
    discount += row.discount;
    commissionTotal += commission;
    net += rowNet;
    if (row.mop === "QR") qr += row.price - row.discount;
    if (row.mop === "CARD") card += row.price - row.discount;
    return { ...row, no: i + 1, commission, net: rowNet };
  });

  const unpaidTotal = round2(unpaids.reduce((sum, u) => sum + u.amount, 0));
  const posReading = round2(price);
  const staffCF = round2(commissionTotal);
  const discounts = round2(discount);

  const [y, m, d] = date.split("-").map(Number);
  return {
    date,
    prettyDate: new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }),
    ledger,
    unpaids,
    totals: {
      price: round2(price),
      discount: discounts,
      commission: staffCF,
      net: round2(net),
    },
    summary: {
      grossSales: round2(posReading - staffCF),
      staffCF,
      posReading,
      unpaids: unpaidTotal,
      discounts,
      qr: round2(qr),
      card: round2(card),
      netCash: round2(posReading - unpaidTotal - discounts - qr - card),
    },
  };
}

/**
 * One daily sheet, mirroring the client's template cell-for-cell:
 *   ledger K = (I - J) * 25%, L = I - K
 *   POS READING = ledger price total + marketing
 *   GROSS SALES = POS READING - STAFF CF
 *   Net Cash    = POS READING - expenses - unpaids - discounts - marketing - QR - card
 *   (Short)/Over = COH - Net Cash
 */
function buildDaySheet(
  date: string,
  transactions: DailyLogTransaction[],
  lookups: DailyLogLookups,
): WorkSheet {
  const model = buildDaySheetModel(date, transactions, lookups);
  const { ledger, unpaids } = model;

  const ws: WorkSheet = {};
  let maxCol = 0;
  let maxRow = 1;
  const colLetter = (i: number) => String.fromCharCode(65 + i);
  const colIndex = (c: string) => c.charCodeAt(0) - 65;

  const put = (
    col: string,
    row: number,
    value: string | number,
    formula?: string,
  ) => {
    const cell: CellObject =
      typeof value === "number"
        ? { t: "n", v: value }
        : { t: "s", v: value };
    if (formula) cell.f = formula;
    ws[`${col}${row}`] = cell;
    maxCol = Math.max(maxCol, colIndex(col));
    maxRow = Math.max(maxRow, row);
  };

  const ledgerCount = Math.max(MIN_LEDGER_ROWS, ledger.length);
  const first = 10;
  const last = first + ledgerCount - 1;
  const totalRow = last + 1;
  const tableCount = Math.max(MIN_TABLE_ROWS, unpaids.length);
  const tableTitleRow = totalRow + 4;
  const tableHeaderRow = tableTitleRow + 1;
  const tableFirst = tableHeaderRow + 1;
  const tableLast = tableFirst + tableCount - 1;
  const tableTotalRow = tableLast + 1;

  const range = (col: string) => `${col}${first}:${col}${last}`;

  // ---- header
  put("C", 3, "DATE:");
  put("D", 3, model.prettyDate);
  put("C", 4, "OPENING CASHIER");
  put("G", 4, "CLOSING CASHIER");
  put("A", 5, "HERO CARWASH");

  // ---- cash breakdown (QTY is typed in by the cashier)
  put("A", 8, "Cash Breakdown");
  put("A", 9, "QTY");
  put("B", 9, "DENOMINATION");
  put("C", 9, "TOTAL COLLECTION");
  DENOMINATIONS.forEach((den, i) => {
    const r = first + i;
    put("B", r, den);
    put("C", r, 0, `A${r}*B${r}`);
  });
  const denLast = first + DENOMINATIONS.length - 1;
  const cashTotalRow = denLast + 1;
  put("A", cashTotalRow, "TOTAL");
  put("C", cashTotalRow, 0, `SUM(C${first}:C${denLast})`);

  // ---- ledger
  put("E", 9, "NO.");
  put("F", 9, "PLATE NO.");
  put("G", 9, "SERVICES");
  put("H", 9, "STAFF");
  put("I", 9, "PRICE");
  put("J", 9, "DISCOUNT 10%");
  put("K", 9, "COMMISSION FEE 25%");
  put("L", 9, "NET SALES");
  put("M", 9, "MOP");
  put("N", 9, "REMARKS");

  for (let i = 0; i < ledgerCount; i++) {
    const r = first + i;
    put("E", r, i + 1);
    const row = ledger[i];
    if (row) {
      put("F", r, row.plate);
      put("G", r, row.service);
      put("H", r, row.staff);
      put("I", r, row.price);
      if (row.discount) put("J", r, row.discount);
      put("K", r, row.commission, `(I${r}-J${r})*${COMMISSION_RATE}`);
      put("L", r, row.net, `I${r}-K${r}`);
      put("M", r, row.mop);
      if (row.remarks) put("N", r, row.remarks);
    } else {
      put("K", r, 0, `(I${r}-J${r})*${COMMISSION_RATE}`);
      put("L", r, 0, `I${r}-K${r}`);
    }
  }

  put("H", totalRow, "TOTAL");
  put("I", totalRow, model.totals.price, `SUM(${range("I")})`);
  put("J", totalRow, model.totals.discount, `SUM(${range("J")})`);
  put("K", totalRow, model.totals.commission, `SUM(${range("K")})`);
  put("L", totalRow, model.totals.net, `SUM(${range("L")})`);

  // ---- bottom tables: expenses (E-G), unpaids (I-L), marketing (N-R)
  put("E", tableTitleRow, "EXPENSES");
  put("I", tableTitleRow, "UNPAIDS");
  put("N", tableTitleRow, "MARKETING");
  put("E", tableHeaderRow, "•");
  put("F", tableHeaderRow, "Particular");
  put("G", tableHeaderRow, "Amount");
  put("I", tableHeaderRow, "•");
  put("K", tableHeaderRow, "Particular");
  put("L", tableHeaderRow, "Amount");
  put("N", tableHeaderRow, "•");
  put("O", tableHeaderRow, "Particular");
  put("P", tableHeaderRow, "Amount");
  put("Q", tableHeaderRow, "Staff");
  put("R", tableHeaderRow, "Commission");

  for (let i = 0; i < tableCount; i++) {
    const r = tableFirst + i;
    put("E", r, "•");
    put("I", r, "•");
    put("N", r, "•");
    const u = unpaids[i];
    if (u) {
      put("K", r, u.particular);
      put("L", r, u.amount);
    }
  }

  const unpaidTotal = model.summary.unpaids;
  put("E", tableTotalRow, "TOTAL");
  put("G", tableTotalRow, 0, `SUM(G${tableFirst}:G${tableLast})`);
  put("I", tableTotalRow, "TOTAL");
  put("L", tableTotalRow, unpaidTotal, `SUM(L${tableFirst}:L${tableLast})`);
  put("N", tableTotalRow, "TOTAL");
  put("P", tableTotalRow, 0, `SUM(P${tableFirst}:P${tableLast})`);
  put("R", tableTotalRow, 0, `SUM(R${tableFirst}:R${tableLast})`);

  // ---- summary report
  const { posReading, staffCF, discounts, qr, card, netCash } = model.summary;

  put("A", 25, "SUMMARY REPORT :");
  put("A", 26, "GROSS SALES");
  put("B", 26, round2(posReading - staffCF), "B29-B27");
  put("A", 27, "STAFF CF");
  put("B", 27, staffCF, `K${totalRow}+R${tableTotalRow}`);
  put("A", 28, "SOLD GC");
  put("A", 29, "POS READING");
  put("B", 29, posReading, `I${totalRow}+B33`);
  put("A", 30, "EXPENSES");
  put("B", 30, 0, `G${tableTotalRow}`);
  put("A", 31, "UNPAIDS");
  put("B", 31, unpaidTotal, `L${tableTotalRow}`);
  put("A", 32, "DISCOUNTS");
  put("B", 32, discounts, `J${totalRow}`);
  put("A", 33, "MARKETING EXPENSE");
  put("B", 33, 0, `P${tableTotalRow}`);
  put("A", 34, "QR/PALAWAN PAY");
  put(
    "B",
    34,
    qr,
    `SUMIF(${range("M")},"QR",${range("I")})-SUMIF(${range("M")},"QR",${range("J")})`,
  );
  put("A", 35, "CARD PAYMENTS");
  put(
    "B",
    35,
    card,
    `SUMIF(${range("M")},"CARD",${range("I")})-SUMIF(${range("M")},"CARD",${range("J")})`,
  );
  put("A", 36, "Net Cash");
  put("B", 36, netCash, "B29-B30-B31-B32-B33-B34-B35");
  put("A", 37, "COH (Cash on Hand)");
  put("B", 37, 0, `C${cashTotalRow}`);
  put("A", 39, "(Short)/Over");
  put("B", 39, round2(0 - netCash), "B37-B36");
  put("A", 40, "Remarks");

  put("A", 43, "IMPORTANT NOTE:");
  put(
    "A",
    44,
    "Fill in the cashier names, the cash breakdown QTY, expenses and marketing;",
  );
  put("A", 45, "everything else calculates automatically.");

  ws["!ref"] = `A1:${colLetter(maxCol)}${maxRow}`;
  ws["!merges"] = [{ s: { r: 7, c: 0 }, e: { r: 7, c: 2 } }];
  ws["!cols"] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
    { wch: 3 },
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 9 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
  ];
  return ws;
}

/** Builds and downloads the .xlsx report. Loads the `xlsx` lib on demand. */
export async function exportReportExcel(
  transactions: DailyLogTransaction[],
  lookups: DailyLogLookups,
  startDate: string,
  endDate: string,
) {
  const rangeLabel =
    startDate === endDate ? startDate : `${startDate} to ${endDate}`;
  const completed = transactions.filter(isCompleted);

  // ---------- Daily sheets (oldest first) ----------
  const byDay = new Map<string, DailyLogTransaction[]>();
  [...completed]
    .filter((t) => t.vehicle_in)
    .sort((a, b) => (a.vehicle_in! < b.vehicle_in! ? -1 : 1))
    .forEach((t) => {
      const day = getAppDate(t.vehicle_in!);
      byDay.set(day, [...(byDay.get(day) || []), t]);
    });

  const days = [...byDay.keys()].sort();
  const singleMonth = new Set(days.map(monthKey)).size <= 1;

  // ---------- Staff Commissions (per day) ----------
  const matrix = buildStaffCommissionMatrix(transactions, lookups.staffNames);
  const commissionAoa: (string | number)[][] = [
    [`STAFF COMMISSIONS: ${rangeLabel}`],
    [],
    ["STAFF", ...matrix.dates, "ORDERS", "TOTAL"],
    ...matrix.rows.map((r) => [
      r.name,
      ...matrix.dates.map((day) => r.perDay[day] ?? ""),
      r.orders,
      r.total,
    ]),
    [
      "TOTAL",
      ...matrix.dates.map((day) => matrix.dayTotals[day] ?? ""),
      matrix.rows.reduce((sum, r) => sum + r.orders, 0),
      matrix.grandTotal,
    ],
    [],
    [
      "Commission is the amount recorded on each completed order, split evenly between the staff assigned to it.",
    ],
  ];

  // ---------- Unpaids ----------
  const unpaidAoa: (string | number)[][] = [
    [`UNPAID ORDERS: ${rangeLabel}`],
    [],
    ["DATE", "ORDER ID", "PLATE NO.", "PARTICULAR", "AMOUNT", "STATUS"],
    ...transactions
      .filter(
        (t) =>
          t.status?.toLowerCase() !== "cancelled" &&
          (isUnpaid(t) || (t.unpaid_note && t.paid_at)),
      )
      .map((t) => [
        t.vehicle_in ? getAppDate(t.vehicle_in) : "",
        t.order_id || "",
        t.plate_number || "",
        t.unpaid_note || "",
        round2(Number(t.total_price || 0)),
        isUnpaid(t)
          ? "UNPAID"
          : `SETTLED ${(t.payment_method || "").toUpperCase()} ${formatAppDateTime(t.paid_at ?? null)}`,
      ]),
  ];

  // ---------- Transactions ----------
  const txAoa: (string | number)[][] = [
    [
      "ORDER ID",
      "DATE / TIME",
      "CUSTOMER",
      "PLATE NO.",
      "SERVICE",
      "STAFF",
      "MOP",
      "TOTAL",
    ],
    ...completed.map((t) => {
      const serviceRel = Array.isArray(t.services) ? t.services[0] : t.services;
      return [
        t.order_id || "",
        formatAppDateTime(t.vehicle_in ?? null),
        t.customer_name || "Guest",
        t.plate_number || "",
        serviceRel?.service_name || "-",
        getMainStaffNames(t, lookups).join("/") || "-",
        isUnpaid(t)
          ? `UNPAID${t.unpaid_note ? ` (${t.unpaid_note})` : ""}`
          : (t.payment_method || "").toUpperCase(),
        round2(Number(t.total_price || 0)),
      ];
    }),
  ];

  const { utils, writeFile } = await import("xlsx");
  const workbook = utils.book_new();

  for (const day of days) {
    const [, mm, dd] = day.split("-");
    const name = singleMonth ? String(Number(dd)) : `${mm}-${dd}`;
    utils.book_append_sheet(
      workbook,
      buildDaySheet(day, byDay.get(day) || [], lookups),
      name,
    );
  }

  const commissionSheet = utils.aoa_to_sheet(commissionAoa);
  commissionSheet["!cols"] = [
    { wch: 22 },
    ...matrix.dates.map(() => ({ wch: 12 })),
    { wch: 9 },
    { wch: 12 },
  ];
  utils.book_append_sheet(workbook, commissionSheet, "Staff Commissions");

  const unpaidSheet = utils.aoa_to_sheet(unpaidAoa);
  unpaidSheet["!cols"] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 12 },
    { wch: 34 },
  ];
  utils.book_append_sheet(workbook, unpaidSheet, "Unpaids");

  const txSheet = utils.aoa_to_sheet(txAoa);
  txSheet["!cols"] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 20 },
    { wch: 12 },
    { wch: 24 },
    { wch: 20 },
    { wch: 24 },
    { wch: 12 },
  ];
  utils.book_append_sheet(workbook, txSheet, "Transactions");

  writeFile(workbook, `Car_Wash_Report_${startDate}_to_${endDate}.xlsx`);
}
