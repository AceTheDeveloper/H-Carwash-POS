import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Ensure this is installed

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Updated Mock Data
const vehicleSpecs = [
  { label: "2 Wheels (Motorcycle/Scooter)", value: "2-wheels" },
  { label: "4 Wheels (Car/SUV/Truck)", value: "4-wheels" },
];

const standardInclusions = [
  { id: "exterior-wash", label: "Exterior Wash" },
  { id: "interior-vacuum", label: "Interior Vacuum" },
  { id: "tire-shine", label: "Tire Shine" },
  { id: "waxing", label: "Waxing / Polishing" },
  { id: "engine-wash", label: "Engine Wash" },
  { id: "glass-cleaning", label: "Glass Cleaning" },
];

export default function ServicesDialog({ isOpen, setIsOpen }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] rounded-lg shadow-lg p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold">
            Add New Service
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Specification */}
          <div className="space-y-2">
            <Label>Vehicle Specification</Label>
            <Select>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Select vehicle type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {vehicleSpecs.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Name and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input
                placeholder="e.g. Premium Wash"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Service Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ₱
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-7 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Inclusions Checkboxes */}
          <div className="space-y-3">
            <Label>Standard Inclusions</Label>
            <div className="grid grid-cols-2 gap-3 border border-border p-4 rounded-md bg-muted/20">
              {standardInclusions.map((inclusion) => (
                <div key={inclusion.id} className="flex items-center space-x-2">
                  <Checkbox id={inclusion.id} />
                  <label
                    htmlFor={inclusion.id}
                    className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {inclusion.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>Save Service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
