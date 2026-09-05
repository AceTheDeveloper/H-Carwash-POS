import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function useStaffCommissionSummary() {
  return useQuery({
    queryKey: ["staff-commissions-summary"],
    queryFn: async () =>
      (await api.get("/api/staff/commissions/summary")).data?.data,
  });
}
