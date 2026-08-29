"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import ServicesTable from "@/components/dashboard/services/ServicesTable";
import { useState } from "react";
import ServicesDialog from "@/components/dashboard/services/ServicesDialog";

export default function ServicesPage() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col space-y-8 p-6 md:p-8 w-full ">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Services Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage, organize, and update your service offerings.
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <main className="flex flex-col space-y-6">
        {/* Toolbar Section: Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Search for services..."
              className="pl-10 bg-card border-border h-10"
            />
          </div>

          {/* Filter & Sort Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-card border-border"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
              Filters
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-card border-border"
            >
              <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
              Sort
            </Button>
          </div>
        </div>

        {/* Table Section */}
        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <ServicesTable />
        </section>
      </main>

      {/* Dialog for adding */}
      <ServicesDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
