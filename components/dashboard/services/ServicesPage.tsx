// components/dashboard/services/ServicesPageClient.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
} from "lucide-react";
import { useState } from "react";
import ServicesDialog from "@/components/dashboard/services/ServicesDialog";
import InclusionSheet from "./InclusionSheet";

export default function ServicesPageClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col space-y-6 p-6 md:p-8 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Services Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage, organize, and update your service offerings.
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <main className="flex flex-col space-y-6">
        {/* Toolbar Section (Fully Responsive Flex Layout) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-4 rounded-xl">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
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
          <div className="flex flex-wrap items-center gap-2">
            <InclusionSheet />

            <Button
              variant="outline"
              className="bg-background border-border h-10 text-xs md:text-sm"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
              Filters
            </Button>

            <Button
              variant="outline"
              className="bg-background border-border h-10 text-xs md:text-sm"
            >
              <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
              Sort
            </Button>
          </div>
        </div>

        {/* Content Table Section */}
        <section className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          {children}
        </section>
      </main>

      <ServicesDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
