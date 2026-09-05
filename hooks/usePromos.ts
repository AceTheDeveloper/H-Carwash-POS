import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function usePromos() {
  return useQuery({
    queryKey: ["promos"],
    queryFn: async () => {
      const res = await api.get("/api/promos");

      return res.data;
    },
  });
}
