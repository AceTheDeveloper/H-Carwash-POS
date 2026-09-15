"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useDraftsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("drafts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drafts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["drafts"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
