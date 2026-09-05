"use client";

import { Input } from "@/components/ui/input";
import { Search, Tag, Loader2 } from "lucide-react";
import { useState } from "react";
import usePromos from "@/hooks/usePromos";
import { PromoData } from "@/types/PromoData";
import { PromoPayload } from "@/types/PromoPayload";
import PromoCard from "@/components/dashboard/promos/PromoCard";
import PromoDialog from "@/components/dashboard/promos/PromoDialog";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function PromosPageClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState<string>("");
  const { data: promos, isLoading } = usePromos();
  const [selectedPromo, setSelectedPromo] = useState<PromoData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handlePromoSubmit(payload: PromoPayload) {
    if (selectedPromo) {
      await api.put(`/api/promos/${selectedPromo.id}`, payload);
    } else {
      await api.post("/api/promos", payload);
    }
    await queryClient.invalidateQueries({ queryKey: ["promos"] });
  }

  const filteredPromos: PromoData[] =
    promos?.filter((promo: PromoData) =>
      promo.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  return (
    <div className="flex flex-col space-y-8 p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Promos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage discount offers applied at checkout.
          </p>
        </div>
        <PromoDialog
          onSubmit={handlePromoSubmit}
          selectedPromo={selectedPromo}
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setSelectedPromo(null); // Clear selection on close
          }}
        />
      </div>

      <main className="flex flex-col space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-xs">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search promos..."
              className="pl-9 bg-background border-border h-10 w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPromos.length > 0 ? (
              filteredPromos.map((promo) => (
                <PromoCard
                  key={promo.id}
                  data={promo}
                  onToggle={() => {
                    setSelectedPromo(promo);
                    setIsDialogOpen(true);
                  }}
                />
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <Tag className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                No promos yet. Click "New Promo" to create one.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
