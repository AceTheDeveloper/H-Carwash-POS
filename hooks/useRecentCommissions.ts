import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function useRecentCommissions(limit = 20) {
  return useQuery({
    queryKey: ["staff-commissions-recent", limit],
    queryFn: async () =>
      (await api.get(`/api/staff/commissions/recent?limit=${limit}`)).data
        ?.data,
  });
}
