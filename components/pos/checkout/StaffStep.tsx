"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, User } from "lucide-react";
import { StaffMember } from "@/types/Checkout";

interface Props {
  staffList: StaffMember[];
  selectedStaff: string[];
  error?: string;
  onToggle: (staffId: string) => void;
}

export default function StaffStep({
  staffList,
  selectedStaff,
  error,
  onToggle,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-sm space-y-4 pb-8">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <User className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Step 6: Staff In Charge (Commission)
        </h2>
      </div>

      <div className="space-y-2 relative pt-2">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full min-h-[48px] px-4 py-2.5 bg-background border-2 rounded-xl flex items-center justify-between cursor-pointer text-sm ${
            error ? "border-red-500" : "border-border/60"
          }`}
        >
          <div className="flex flex-wrap gap-1.5 items-center">
            {selectedStaff.length === 0 ? (
              <span className="text-muted-foreground">
                Select staff member(s)...
              </span>
            ) : (
              selectedStaff.map((id) => {
                const staffObj = staffList.find((s) => s.id === id);
                return (
                  <span
                    key={id}
                    className="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium text-xs"
                  >
                    {staffObj?.name}
                  </span>
                );
              })
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {isOpen && (
          <div className="relative border border-border rounded-xl shadow-sm p-2 space-y-1 bg-background">
            {staffList.map((staff) => {
              const isChecked = selectedStaff.includes(staff.id);
              return (
                <div
                  key={staff.id}
                  onClick={() => onToggle(staff.id)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer text-sm font-medium"
                >
                  <span>{staff.name}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isChecked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
