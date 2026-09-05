import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await api.get("/api/staff");
      return res.data?.data ?? res.data;
    },
  });
}
