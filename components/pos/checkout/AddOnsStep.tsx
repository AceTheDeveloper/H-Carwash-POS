"use client";

import { AddOnsData } from "@/types/AddOnsData";
import { StaffMember } from "@/types/Checkout";
import { CheckCircle2, Tag, User } from "lucide-react";

interface SelectedAddOnWithSeller extends AddOnsData {
  seller_id?: string | null;
}

interface Props {
  addOns: AddOnsData[];
  selectedAddOns: SelectedAddOnWithSeller[];
  staffList: StaffMember[]; // ⬅️ Added staff list
  isSubmitting: boolean;
  onToggle: (addon: AddOnsData) => void;
  onUpdateSeller: (addonId: string, sellerId: string) => void; // ⬅️ Added seller updater
}

export default function AddOnsStep({
  addOns,
  selectedAddOns,
  staffList,
  isSubmitting,
  onToggle,
  onUpdateSeller,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Tag className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Step 4: Add-Ons (Optional)
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {addOns.length > 0 ? (
          addOns.map((addon) => {
            const selectedItem = selectedAddOns.find(
              (item) => item.id === addon.id,
            );
            const isSelected = !!selectedItem;

            return (
              <div
                key={addon.id}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/10"
                    : "border-border/60 bg-card hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                {/* Main clickable card header */}
                <div
                  onClick={() => !isSubmitting && onToggle(addon)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex flex-col pr-2">
                    <span className="font-semibold text-foreground text-sm">
                      {addon.label}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 font-medium">
                      ₱
                      {Number(addon.price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-transparent"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Top-Up Seller Dropdown (Only shows if this add-on is selected) */}
                {isSelected && (
                  <div
                    className="pt-2 border-t border-border/40 space-y-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <User className="w-3 h-3" /> Sold By (Top-Up)
                    </label>
                    <select
                      disabled={isSubmitting}
                      value={selectedItem.seller_id || ""}
                      onChange={(e) => onUpdateSeller(addon.id, e.target.value)}
                      className="w-full h-9 px-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:outline-primary"
                    >
                      <option value="">Select staff member...</option>
                      {staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
            No add-ons available.
          </div>
        )}
      </div>
    </div>
  );
}
