// lib/dailyLogExport.ts
//
// Builds the "Daily Log" Excel sheet that mirrors the paper ledger:
// NO. | PLATE NO. | SERVICES | STAFF | PRICE | DISCOUNT 10% |
// COMMISSION FEE 25% | NET SALES | MOP | REMARKS
//
// Unlike the normal report export (one row per transaction), this
// splits every add-on (Engine Wash, Back to Zero, etc.) into its own
// row with its own 25% commission, because that's how the paper log
// tracks it. This means the commission shown here can differ from the
// `commission_amount` already stored on `transaction_staff` (which is
// 25% of the whole transaction total, split evenly across staff) —
// that's expected, not a bug.

const COMMISSION_RATE = 0.25;

export interface DailyLogStaffRow {
  staff_id?: string | null;
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
  plate_number?: string | null;
  service_price?: number | null;
  total_price?: number | null;
  payment_method?: string | null;
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

interface DailyLogRow {
  no: number;
  plate: string;
  service: string;
  staff: string;
  price: number;
  discount: number;
  commission: number;
  net: number;
  mop: string;
  remarks: number | "";
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
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

function buildRow(
  no: number,
  plate: string,
  serviceLabel: string,
  staffNames: string[],
  price: number,
  discount: number,
  mop: string,
): DailyLogRow {
  const commission = round2(price * COMMISSION_RATE);
  const net = round2(price - discount - commission);
  const staffCount = staffNames.length || 1;
  const remarks: number | "" =
    staffCount > 1 ? round2(commission / staffCount) : "";

  return {
    no,
    plate,
    service: serviceLabel,
    staff: staffNames.join("/") || "-",
    price: round2(price),
    discount: round2(discount),
    commission,
    net,
    mop: (mop || "").toUpperCase(),
    remarks,
  };
}

export interface DailyLogManualInputs {
  /** Gift certificates sold today — not tracked by the app, enter by hand. */
  soldGC?: number;
  expenses?: number;
  unpaids?: number;
  marketingExpense?: number;
}

interface SummaryReport {
  grossSales: number;
  staffCF: number;
  soldGC: number;
  posReading: number;
  expenses: number;
  unpaids: number;
  discounts: number;
  marketingExpense: number;
  qrPalawanPay: number;
  cardPayments: number;
  netCash: number;
  coh: number;
}

function isCardMop(mop: string) {
  return mop.toUpperCase().includes("CARD");
}
function isCashMop(mop: string) {
  return mop.toUpperCase() === "CASH";
}

/**
 * Everything here is derived straight from the rows already on the daily
 * log, except the four DailyLogManualInputs — the app has no data source
 * for gift certificates sold, expenses, unpaid balances, or marketing
 * spend, so those default to 0 and are meant to be edited by hand in the
 * downloaded sheet (or passed in if you wire up a small form later).
 */
export function computeSummaryReport(
  rows: DailyLogRow[],
  manual: DailyLogManualInputs = {},
): SummaryReport {
  const soldGC = manual.soldGC || 0;
  const expenses = manual.expenses || 0;
  const unpaids = manual.unpaids || 0;
  const marketingExpense = manual.marketingExpense || 0;

  const posReading = round2(rows.reduce((sum, r) => sum + r.price, 0));
  const discounts = round2(rows.reduce((sum, r) => sum + r.discount, 0));
  const staffCF = round2(rows.reduce((sum, r) => sum + r.commission, 0));
  const grossSales = round2(rows.reduce((sum, r) => sum + r.net, 0));

  const qrPalawanPay = round2(
    rows
      .filter((r) => !isCashMop(r.mop) && !isCardMop(r.mop))
      .reduce((sum, r) => sum + r.price, 0),
  );
  const cardPayments = round2(
    rows.filter((r) => isCardMop(r.mop)).reduce((sum, r) => sum + r.price, 0),
  );

  const netCash = round2(
    posReading -
      discounts -
      expenses -
      unpaids -
      marketingExpense -
      qrPalawanPay -
      cardPayments +
      soldGC,
  );
  // No opening float tracked yet, so Cash on Hand starts equal to Net Cash.
  // Adjust the downloaded cell by hand if a starting float applies.
  const coh = netCash;

  return {
    grossSales,
    staffCF,
    soldGC,
    posReading,
    expenses,
    unpaids,
    discounts,
    marketingExpense,
    qrPalawanPay,
    cardPayments,
    netCash,
    coh,
  };
}

/** Pure transform — exported separately so it's easy to unit test. */
export function buildDailyLogRows(
  transactions: DailyLogTransaction[],
  lookups: DailyLogLookups,
): DailyLogRow[] {
  const rows: DailyLogRow[] = [];
  let counter = 1;

  for (const t of transactions) {
    const plate = t.plate_number || "";
    const mop = t.payment_method || "";
    const addOns = t.transaction_add_ons || [];
    const addOnsTotal = addOns.reduce(
      (sum, a) => sum + Number(a.price || 0),
      0,
    );
    const servicePrice = Number(t.service_price || 0);
    const subtotal = servicePrice + addOnsTotal;
    // Whatever the promo/discount shaved off the transaction total,
    // attributed to the main service line.
    const totalDiscount = Math.max(
      0,
      subtotal - Number(t.total_price ?? subtotal),
    );

    const mainStaffNames = getMainStaffNames(t, lookups);
    const serviceRel = Array.isArray(t.services) ? t.services[0] : t.services;
    const serviceLabel = serviceRel?.service_name || "-";

    rows.push(
      buildRow(
        counter++,
        plate,
        serviceLabel,
        mainStaffNames,
        servicePrice,
        totalDiscount,
        mop,
      ),
    );

    for (const addOn of addOns) {
      const label =
        (addOn.add_on_id && lookups.addOnLabels[addOn.add_on_id]) || "Add-on";
      const sellerNames = addOn.seller_id
        ? [lookups.staffNames[addOn.seller_id] || "Unknown"]
        : mainStaffNames;

      rows.push(
        buildRow(
          counter++,
          plate,
          label,
          sellerNames,
          Number(addOn.price || 0),
          0,
          mop,
        ),
      );
    }
  }

  return rows;
}

/** Builds and downloads the .xlsx file. Loads the `xlsx` lib on demand. */
export async function exportDailyLogExcel(
  transactions: DailyLogTransaction[],
  lookups: DailyLogLookups,
  startDate: string,
  endDate: string,
  manual: DailyLogManualInputs = {},
) {
  const rows = buildDailyLogRows(transactions, lookups);
  const summary = computeSummaryReport(rows, manual);

  const headers = [
    "NO.",
    "PLATE NO.",
    "SERVICES",
    "STAFF",
    "PRICE",
    "DISCOUNT 10%",
    "COMMISSION FEE 25%",
    "NET SALES",
    "MOP",
    "REMARKS",
  ];

  const totals = rows.reduce(
    (acc, r) => {
      acc.price += r.price;
      acc.discount += r.discount;
      acc.commission += r.commission;
      acc.net += r.net;
      return acc;
    },
    { price: 0, discount: 0, commission: 0, net: 0 },
  );

  const aoa: (string | number)[][] = [
    headers,
    ...rows.map((r) => [
      r.no,
      r.plate,
      r.service,
      r.staff,
      r.price,
      r.discount || "",
      r.commission,
      r.net,
      r.mop,
      r.remarks,
    ]),
    [
      "",
      "",
      "",
      "TOTAL",
      round2(totals.price),
      round2(totals.discount),
      round2(totals.commission),
      round2(totals.net),
      "",
      "",
    ],
    [],
    ["SUMMARY REPORT"],
    ["GROSS SALES", summary.grossSales],
    ["STAFF CF", summary.staffCF],
    ["SOLD GC", summary.soldGC || ""],
    ["POS READING", summary.posReading],
    ["EXPENSES", summary.expenses],
    ["UNPAIDS", summary.unpaids],
    ["DISCOUNTS", summary.discounts],
    ["MARKETING EXPENSE", summary.marketingExpense],
    ["QR/PALAWAN PAY", summary.qrPalawanPay],
    ["CARD PAYMENTS", summary.cardPayments || ""],
    ["Net Cash", summary.netCash],
    ["COH (Cash on Hand)", summary.coh],
    [],
    ["(Short)/Over", ""],
    ["Remarks", ""],
  ];

  const { utils, writeFile } = await import("xlsx");
  const worksheet = utils.aoa_to_sheet(aoa);
  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 26 },
    { wch: 20 },
    { wch: 10 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
  ];

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Daily Log");
  writeFile(workbook, `Daily_Log_${startDate}_to_${endDate}.xlsx`);
}
