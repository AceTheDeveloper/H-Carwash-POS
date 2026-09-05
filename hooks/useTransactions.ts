import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function useTransactions(status?: string) {
  return useQuery({
    queryKey: ["transactions", status],
    queryFn: async () => {
      const res = await api.get("/api/transactions", {
        params: status ? { status } : {},
      });
      return res.data;
    },
  });
}
