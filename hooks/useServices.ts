import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/api/services");
      return res.data;
    },
  });
}
