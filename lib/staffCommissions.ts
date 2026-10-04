// lib/staffCommissions.ts
//
// Staff commissions per day, built from the transactions the reports API
// already returns (transaction_staff.commission_amount is written when an
// order is marked completed, so only completed orders carry a commission).

import { getAppDate } from "@/lib/date";

export interface CommissionStaffRow {
  staff_id?: string | null;
  commission_amount?: number | null;
  staffs?:
    | { id?: string; name?: string }
    | { id?: string; name?: string }[]
    | null;
}

export interface CommissionTransaction {
  vehicle_in?: string | null;
  status?: string | null;
  transaction_staff?: CommissionStaffRow[] | null;
}

export interface StaffCommissionRow {
  staffId: string;
  name: string;
  /** YYYY-MM-DD -> commission earned that day */
  perDay: Record<string, number>;
  /** Completed orders this staff member worked on */
  orders: number;
  total: number;
}

export interface StaffCommissionMatrix {
  /** Ascending YYYY-MM-DD, only days that have at least one commission */
  dates: string[];
  rows: StaffCommissionRow[];
  dayTotals: Record<string, number>;
  grandTotal: number;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function buildStaffCommissionMatrix(
  transactions: CommissionTransaction[],
  staffNames: Record<string, string> = {},
  onlyStaffId?: string,
): StaffCommissionMatrix {
  const byStaff = new Map<string, StaffCommissionRow>();
  const dayTotals: Record<string, number> = {};

  for (const t of transactions) {
    if (t.status?.toLowerCase() !== "completed" || !t.vehicle_in) continue;
    const day = getAppDate(t.vehicle_in);

    for (const ts of t.transaction_staff || []) {
      const staffId = ts.staff_id || "";
      if (!staffId || (onlyStaffId && staffId !== onlyStaffId)) continue;

      const amount = Number(ts.commission_amount || 0);
      const rel = Array.isArray(ts.staffs) ? ts.staffs[0] : ts.staffs;
      const name = rel?.name || staffNames[staffId] || "Unknown Staff";

      let row = byStaff.get(staffId);
      if (!row) {
        row = { staffId, name, perDay: {}, orders: 0, total: 0 };
        byStaff.set(staffId, row);
      }
      row.perDay[day] = round2((row.perDay[day] || 0) + amount);
      row.orders += 1;
      row.total = round2(row.total + amount);
      dayTotals[day] = round2((dayTotals[day] || 0) + amount);
    }
  }

  const rows = [...byStaff.values()].sort((a, b) => b.total - a.total);
  const dates = Object.keys(dayTotals).sort();
  const grandTotal = round2(rows.reduce((sum, r) => sum + r.total, 0));

  return { dates, rows, dayTotals, grandTotal };
}
