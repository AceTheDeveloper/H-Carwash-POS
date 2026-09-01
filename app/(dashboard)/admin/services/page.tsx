// components/dashboard/services/ServicesPageClient.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import ServicesDialog from "@/components/dashboard/services/ServicesDialog";
import InclusionSheet from "@/components/dashboard/services/InclusionSheet";
import useInclusions from "@/hooks/useInclusions";
import ServicesTable from "@/components/dashboard/services/ServicesTable";

export default function ServicesPageClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { data: inclusion, isLoading: inclusionisLoading } = useInclusions();

  return (
    <div className="flex flex-col space-y-6 p-4 sm:p-6 md:p-8 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Services Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage, organize, and update your service offerings.
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

      <main className="flex flex-col space-y-4 sm:space-y-6">
        {/* Toolbar Section */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 bg-card rounded-xl">
          {/* Search Bar */}
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              placeholder="Search services..."
              className="pl-9 bg-background border-border h-10 w-full"
            />
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-row items-center gap-2 w-full lg:w-auto overflow-x-auto overflow-y-hidden pb-1 sm:pb-0">
            <Button
              variant="outline"
              className="flex-1 lg:flex-none bg-background border-border h-10 text-xs sm:text-sm whitespace-nowrap"
            >
              <SlidersHorizontal className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              Filters
            </Button>

            <Button
              variant="outline"
              className="flex-1 lg:flex-none bg-background border-border h-10 text-xs sm:text-sm whitespace-nowrap"
            >
              <ArrowUpDown className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              Sort
            </Button>

            {/* Wrapped in a flex-1 container so it scales evenly on mobile alongside the other buttons */}
            <div className="flex-1 lg:flex-none min-w-fit">
              <InclusionSheet
                inclusions={inclusion}
                isLoading={inclusionisLoading}
              />
            </div>
          </div>
        </div>

        {/* Content Table Section */}
        <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <ServicesTable />
        </section>
      </main>

      <ServicesDialog isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* <ServicesDialog isOpen={isOpen} setIsOpen={setIsOpen} /> */}
    </div>
  );
}
