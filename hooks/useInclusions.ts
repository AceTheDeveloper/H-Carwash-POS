import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function useInclusions() {
  return useQuery({
    queryKey: ["inclusions"],
    queryFn: async () => {
      const res = await api.get("/api/inclusions");
      return res.data;
    },
  });
}
