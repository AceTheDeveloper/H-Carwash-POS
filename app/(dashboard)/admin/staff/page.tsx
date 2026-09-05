"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  Wallet,
  ArrowUpDown,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import useStaff from "@/hooks/useStaff";
import useStaffCommissionSummary from "@/hooks/useStaffCommissionSummary";
import useRecentCommissions from "@/hooks/useRecentCommissions";
import { StaffData } from "@/types/StaffData";
import { StaffPayload } from "@/types/StaffPayload";
import {
  StaffCommissionSummary,
  RecentCommission,
} from "@/types/CommissionData";
import StaffDialog from "@/components/dashboard/staff/StaffDialog";
import StaffViewDialog from "@/components/dashboard/staff/StaffViewDialog";

export default function StaffCommissionPage() {
  const queryClient = useQueryClient();
  const { data: staffList, isLoading } = useStaff();
  const { data: commissionSummary, isLoading: isSummaryLoading } =
    useStaffCommissionSummary();
  const { data: recentCommissions, isLoading: isRecentLoading } =
    useRecentCommissions(20);

  const [search, setSearch] = useState("");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffData | null>(null);

  const handleStaffSubmit = async (payload: StaffPayload) => {
    await api.post("/api/staff", payload);
    await queryClient.invalidateQueries({ queryKey: ["staff"] });
  };

  const handleModifyStaff = async (id: string, data: { name: string }) => {
    await api.put(`/api/staff/${id}`, data);
    await queryClient.invalidateQueries({ queryKey: ["staff"] });
  };

  const handleRemoveStaff = async (id: string) => {
    await api.delete(`/api/staff/${id}`);
    await queryClient.invalidateQueries({ queryKey: ["staff"] });
  };

  const filteredStaff: StaffData[] =
    staffList?.filter((staff: StaffData) =>
      staff.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  // Map staff_id -> total_earned for quick lookup while rendering staff cards
  const earningsByStaffId = new Map<string, number>(
    (commissionSummary || []).map((s: StaffCommissionSummary) => [
      s.staff_id,
      s.total_earned,
    ]),
  );

  return (
    <div className="flex flex-col space-y-8 p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Staff & Commission
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your team members and track their commission earnings.
          </p>
        </div>
        <StaffDialog onSubmit={handleStaffSubmit} />
      </div>

      <main className="flex flex-col space-y-8">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-xs">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff members..."
              className="pl-9 bg-background border-border h-10 w-full"
            />
          </div>
          <div className="flex flex-row items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <Button
              variant="outline"
              className="flex-1 lg:flex-none bg-background border-border h-10 text-xs sm:text-sm whitespace-nowrap"
            >
              <ArrowUpDown className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              Sort
            </Button>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Team Members
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => {
                  const totalEarned = earningsByStaffId.get(staff.id) ?? 0;
                  return (
                    <div
                      key={staff.id}
                      className="relative p-4 rounded-xl border-2 border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-foreground">
                          {staff.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full -mt-1 -mr-1"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setIsViewOpen(true);
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>

                      <div className="pt-3 border-t border-border/50">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Total Earned
                        </p>
                        {isSummaryLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground mt-1" />
                        ) : (
                          <p className="text-sm font-bold text-primary mt-0.5">
                            ₱
                            {totalEarned.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  No staff members found matching "{search}".
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Recent Commissions
              </h2>
              <p className="text-xs text-muted-foreground">
                Latest payouts and earnings grouped by transaction.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Service Provided</th>
                    <th className="px-4 py-3 text-right">Commission (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isRecentLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                      </td>
                    </tr>
                  ) : recentCommissions && recentCommissions.length > 0 ? (
                    recentCommissions.map((item: RecentCommission) => (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.staff_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.service_name}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">
                          +₱
                          {item.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No commissions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <StaffViewDialog
        isOpen={isViewOpen}
        setIsOpen={setIsViewOpen}
        staff={selectedStaff}
        onModify={handleModifyStaff}
        onRemove={handleRemoveStaff}
      />
    </div>
  );
}
