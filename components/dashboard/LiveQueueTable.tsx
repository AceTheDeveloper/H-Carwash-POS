"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, Clock } from "lucide-react";

const MOCK_QUEUE = [
  {
    id: "TX-1092",
    plateNo: "NBI 4291",
    vehicle: "Toyota Fortuner (L)",
    service: "Premium Medium + Cappuccino",
    total: "₱720.00",
    timeIn: "10:15 AM",
    status: "Washing",
  },
  {
    id: "TX-1091",
    plateNo: "ZKC 8832",
    vehicle: "Honda Civic (M)",
    service: "Basic Eco",
    total: "₱250.00",
    timeIn: "10:30 AM",
    status: "Queued",
  },
  {
    id: "TX-1090",
    plateNo: "WQA 1209",
    vehicle: "Ford Ranger (XL)",
    service: "Interior Detailing + Iced Latte",
    total: "₱1,450.00",
    timeIn: "09:45 AM",
    status: "Ready",
  },
  {
    id: "TX-1089",
    plateNo: "GHT 7712",
    vehicle: "Suzuki Espresso (S)",
    service: "Basic Eco",
    total: "₱200.00",
    timeIn: "10:48 AM",
    status: "Washing",
  },
  {
    id: "TX-1088",
    plateNo: "ABC 1234",
    vehicle: "Hyundai Tucson (M)",
    service: "Wax & Shine",
    total: "₱550.00",
    timeIn: "10:55 AM",
    status: "Queued",
  },
];

export function LiveQueueTable() {
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
        <button className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
          View All Transactions <ArrowUpRight className="size-3.5" />
        </button>
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
              {MOCK_QUEUE.map((row) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Logic mapper utilizing your exact brand color variables
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
