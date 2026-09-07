// components/dashboard/LiveQueueTable.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, Clock } from "lucide-react";

interface QueueItem {
  id: string;
  plateNo: string;
  vehicle: string;
  service: string;
  total: string;
  timeIn: string;
  status: string;
}

interface LiveQueueTableProps {
  queueData?: QueueItem[]; // Make it optional with ?
}

export function LiveQueueTable({ queueData = [] }: LiveQueueTableProps) {
  return (
    <Card className="rounded-md border border-border bg-surface shadow-sm overflow-hidden p-0">
      <CardHeader className="p-6 rounded-none border-b border-border/40 bg-background/30 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-bold text-text-primary tracking-tight">
            Active Wash Queue
          </CardTitle>
          <CardDescription className="text-xs text-text-secondary mt-0.5">
            Real-time status updates for vehicles currently in the shop
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50 text-text-secondary font-semibold text-xs tracking-wider uppercase">
                <th className="p-4 pl-6">Plate No.</th>
                <th className="p-4">Vehicle Model</th>
                <th className="p-4">Service Package</th>
                <th className="p-4">Time Checked In</th>
                <th className="p-4">Amount Due</th>
                <th className="p-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-medium text-text-primary">
              {queueData && queueData.length > 0 ? (
                queueData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-background/20 transition-colors"
                  >
                    <td className="p-4 pl-6 font-mono font-bold tracking-wider text-primary bg-primary/5 rounded-sm inline-block my-2 ml-4">
                      {row.plateNo}
                    </td>
                    <td className="p-4 align-middle text-text-primary">
                      {row.vehicle}
                    </td>
                    <td className="p-4 align-middle text-text-primary text-xs font-semibold">
                      {row.service}
                    </td>
                    <td className="p-4 align-middle text-text-secondary text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5" /> {row.timeIn}
                      </div>
                    </td>
                    <td className="p-4 align-middle font-bold">{row.total}</td>
                    <td className="p-4 pr-6 align-middle text-right">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border-0 ${getStatusStyles(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-text-secondary"
                  >
                    No active vehicles in queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case "Ready":
      return "bg-success/10 text-success";
    case "Washing":
      return "bg-warning/10 text-warning";
    default:
      return "bg-text-secondary/10 text-text-secondary";
  }
}
