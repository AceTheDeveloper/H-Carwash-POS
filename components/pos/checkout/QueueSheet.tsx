"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import {
  CarFront,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  PlayCircle,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queueList: any[];
  isLoading: boolean;
  onStatusChanged: () => void; // callback to refetch transactions after update
}

export default function QueueSheet({
  open,
  onOpenChange,
  queueList,
  isLoading,
  onStatusChanged,
}: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateStatus = async (
    id: string,
    status: "in_progress" | "completed",
  ) => {
    setUpdatingId(id);
    try {
      await api.patch(`/api/pos/transactions/${id}/status`, { status });
      onStatusChanged();
    } catch (error) {
      console.error("Failed to update order status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusStyles: Record<string, string> = {
    pending: "bg-warning/15 text-warning border border-warning/30",
    in_progress: "bg-primary/15 text-primary border border-primary/30",
    completed: "bg-success/15 text-success border border-success/30",
    cancelled: "bg-error/15 text-error border border-error/30",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger>
        <button
          type="button"
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm font-semibold text-foreground hover:border-primary/40 hover:shadow-sm transition-all"
        >
          <ClipboardList className="w-4 h-4 text-primary" />
          Queue
          {queueList.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {queueList.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Live Queue
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-100px)] px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading queue...
            </div>
          ) : queueList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <CarFront className="w-10 h-10 mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium">No active orders</p>
              <p className="text-xs mt-1">New orders will show up here.</p>
            </div>
          ) : (
            queueList.map((order) => {
              const isUpdating = updatingId === order.id;
              return (
                <div
                  key={order.id}
                  className="p-4 rounded-xl border border-border/60 bg-card shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {order.plate_number}
                      </p>
                    </div>
                    <Badge
                      className={`capitalize ${statusStyles[order.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.vehicle_in
                        ? new Date(order.vehicle_in).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--"}
                    </span>
                    <span className="font-semibold text-foreground">
                      ₱
                      {Number(order.total_price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Action buttons based on current status */}
                  <div className="pt-1">
                    {order.status === "pending" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(order.id, "in_progress")}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PlayCircle className="w-3.5 h-3.5" />
                        )}
                        Start Washing
                      </button>
                    )}

                    {order.status === "in_progress" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(order.id, "completed")}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600/10 text-green-700 text-xs font-semibold hover:bg-green-600/20 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Mark Completed / Vehicle Out
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
