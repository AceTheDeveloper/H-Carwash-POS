"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarFront } from "lucide-react";
import { VehicleSpecification } from "@/types/Checkout";

interface Props {
  value: VehicleSpecification;
  isSubmitting: boolean;
  onChange: (val: VehicleSpecification) => void;
}

export default function VehicleTypeStep({
  value,
  isSubmitting,
  onChange,
}: Props) {
  return (
    <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <CarFront className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Step 2: Select Vehicle Type
        </h2>
      </div>
      <Tabs
        value={value}
        onValueChange={(val) => onChange(val as VehicleSpecification)}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger
            value="4-wheels"
            disabled={isSubmitting}
            className="rounded-lg font-semibold border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary-dark data-[state=active]:shadow-sm"
          >
            4 Wheels
          </TabsTrigger>
          <TabsTrigger
            value="2-wheels"
            disabled={isSubmitting}
            className="rounded-lg font-semibold border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary-dark data-[state=active]:shadow-sm"
          >
            2 Wheels
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
