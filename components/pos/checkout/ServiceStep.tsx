"use client";

import ServicesCard from "@/components/pos/ServicesCard";
import { ServicesData } from "@/types/ServicesData";
import { SizeOption } from "@/types/Checkout";
import { CheckCircle2, Settings2, Sparkles, AlertCircle } from "lucide-react";

interface Props {
  services: ServicesData[];
  selectedService: ServicesData | null;
  selectedSizeObj: SizeOption | null;
  isSubmitting: boolean;
  onSelectService: (service: ServicesData) => void;
  onSelectSize: (size: SizeOption) => void;
}

export default function ServiceStep({
  services,
  selectedService,
  selectedSizeObj,
  isSubmitting,
  onSelectService,
  onSelectSize,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Step 3: Choose Service
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.length > 0 ? (
          services.map((service) => {
            const isSelected = selectedService?.id === service.id;
            return (
              <div
                key={service.id}
                onClick={() => !isSubmitting && onSelectService(service)}
                className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${
                  isSelected
                    ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/10 scale-[1.01]"
                    : "border-transparent bg-card hover:border-primary/40 hover:shadow-sm"
                } ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10 text-primary bg-background rounded-full shadow-sm">
                    <CheckCircle2 className="w-6 h-6 fill-primary text-primary-foreground" />
                  </div>
                )}
                <div className="p-1">
                  <ServicesCard service={service} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
            <AlertCircle className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-base font-medium text-foreground">
              No services found
            </p>
          </div>
        )}
      </div>

      {selectedService && (
        <div className="bg-card p-5 rounded-2xl border border-primary/40 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Select Size for &quot;{selectedService.service_name}&quot;
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {((selectedService.size as SizeOption[]) || []).map((sizeObj) => {
              const isSizeSelected = selectedSizeObj?.size === sizeObj.size;
              return (
                <button
                  key={sizeObj.size}
                  type="button"
                  onClick={() => onSelectSize(sizeObj)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    isSizeSelected
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                      : "border-border/60 bg-background hover:border-primary/40 text-foreground"
                  }`}
                >
                  <span className="capitalize text-sm">{sizeObj.size}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    ₱
                    {Number(sizeObj.price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
