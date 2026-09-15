"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function useDrafts() {
  return useQuery({
    queryKey: ["drafts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drafts")
        .select("*")
        .order("saved_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data;
    },
  });
}
