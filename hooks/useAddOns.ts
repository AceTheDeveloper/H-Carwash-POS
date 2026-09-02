import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function useAddOns() {
  return useQuery({
    queryKey: ["add-ons"],
    queryFn: async () => {
      const res = await api.get("/api/add-ons");
      if (res.status !== 200) {
        throw new Error("Failed to fetch add-ons");
      }
      return res.data;
    },
  });
}
