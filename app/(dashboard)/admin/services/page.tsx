"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  ArrowUpDown,
  Sparkles,
  Layers,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import ServicesDialog from "@/components/dashboard/services/ServicesDialog";
import InclusionSheet from "@/components/dashboard/services/InclusionSheet";
import useInclusions from "@/hooks/useInclusions";
import ServicesTable from "@/components/dashboard/services/ServicesTable";
import { AddOnsData } from "@/types/AddOnsData";
import AddOnsCard from "@/components/dashboard/add-ons/AddOnsCard";
import AddOnsDialog from "@/components/dashboard/add-ons/AddOnsDialog";
import useAddOns from "@/hooks/useAddOns";
import { AddOnsPayload } from "@/types/AddOnsPayload";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function ServicesPageClient() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { data: inclusion, isLoading: inclusionisLoading } = useInclusions();
  const { data: add_ons, isLoading: add_onsIsLoading } = useAddOns();
  const [search, setSearch] = useState<string>("");

  async function handleAddOnsSubmit(payload: AddOnsPayload) {
    await api.post("/api/add-ons", payload);

    // ADDED AWAIT HERE
    await queryClient.invalidateQueries({ queryKey: ["add_ons"] });
  }

  return (
    <div className="flex flex-col space-y-8 p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Services & Add-Ons
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your service packages, inclusions, and extra add-ons.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <main className="flex flex-col space-y-8">
        {/* Services Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Main Services
              </h2>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-xs">
            {/* Search Bar */}
            <div className="relative w-full lg:max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="pl-9 bg-background border-border h-10 w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-row items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
              <Button
                variant="outline"
                className="flex-1 lg:flex-none bg-background border-border h-10 text-xs sm:text-sm whitespace-nowrap"
              >
                <ArrowUpDown className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                Sort
              </Button>

              <div className="flex-1 lg:flex-none min-w-fit">
                <InclusionSheet
                  inclusions={inclusion}
                  isLoading={inclusionisLoading}
                />
              </div>
            </div>
          </div>

          {/* Services Table Container */}
          <div className="bg-card rounded-xl border border-border/60 shadow-xs overflow-hidden">
            <ServicesTable search={search} setSearch={() => setSearch} />
          </div>
        </section>

        {/* Add-Ons Section */}
        <section className="space-y-4 pt-4 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Available Add-Ons
                </h2>
                <p className="text-xs text-muted-foreground">
                  Extra options available for customers during checkout
                </p>
              </div>
            </div>
            <AddOnsDialog onSubmit={handleAddOnsSubmit} />
          </div>

          {/* Add-ons Grid */}
          {add_onsIsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {add_ons?.length > 0 ? (
                add_ons.map((addon: AddOnsData) => (
                  <AddOnsCard key={addon.id} data={addon} />
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  No add-ons available. Click "New Add-On" to create one.
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <ServicesDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
