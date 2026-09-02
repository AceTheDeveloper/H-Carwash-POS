"use client";

import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2 } from "lucide-react";
import useInclusions from "@/hooks/useInclusions";
import { InclusionData } from "@/types/InclusionData";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { ServicesPayload } from "@/types/ServicesPayload";

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const vehicleSpecs = [
  { label: "2 Wheels (Motorcycle/Scooter)", value: "2-wheels" },
  { label: "4 Wheels (Car/SUV/Truck)", value: "4-wheels" },
];

export default function ServicesDialog({ isOpen, setIsOpen }: Props) {
  const queryClient = useQueryClient();
  const { data: inclusions, isLoading: inclusionIsLoading } = useInclusions();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServicesPayload>({
    defaultValues: {
      service_name: "",
      vehicle_type: "4-wheels",
      inclusions: [],
      size: [{ size: "", price: 0 }],
    },
  });

  // Setup field array for dynamic size rows
  const { fields, append, remove } = useFieldArray({
    control,
    name: "size",
  });

  async function onSubmit(data: ServicesPayload) {
    setIsLoading(true);
    try {
      await api.post("/api/services", data);
      reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    } catch (error) {
      console.error("Failed to save service:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleClose = (open: boolean) => {
    if (isLoading) return;
    setIsOpen(open);
    if (!open) reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold">
            Add New Service Package
          </DialogTitle>
        </DialogHeader>

        <form
          id="service-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Vehicle Specification */}
          <div className="space-y-2">
            <Label>Vehicle Specification</Label>
            <Controller
              control={control}
              name="vehicle_type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full bg-background rounded-md">
                    <SelectValue placeholder="Select vehicle type..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectGroup>
                      {vehicleSpecs.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                          className="rounded-md"
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Service Name */}
          <div className="space-y-2">
            <Label>Service Name</Label>
            <Input
              {...register("service_name", {
                required: "Service Name is required",
              })}
              disabled={isLoading}
              placeholder="e.g. Premium Wash"
              className="bg-background"
            />
            {errors.service_name && (
              <p className="text-sm font-medium text-destructive">
                {errors.service_name.message}
              </p>
            )}
          </div>

          {/* Dynamic Size & Price Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Size & Pricing Matrix</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ size: "", price: 0 })}
                className="h-8 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Size Variant
              </Button>
            </div>

            <div className="space-y-3 border border-border p-4 rounded-md bg-muted/20">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3">
                  {/* Size Name Input */}
                  <div className="flex-1">
                    <Input
                      {...register(`size.${index}.size` as const, {
                        required: "Size name required",
                      })}
                      placeholder="e.g. Small / Medium / Big Bike"
                      className="bg-background text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Price Input */}
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₱
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`size.${index}.price` as const, {
                        required: true,
                        valueAsNumber: true,
                      })}
                      className="pl-7 bg-background text-sm"
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Remove Button (Hide if only 1 item is left) */}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.size && (
                <p className="text-sm font-medium text-destructive mt-1">
                  Please properly fill out all size variants.
                </p>
              )}
            </div>
          </div>

          {/* Inclusions Checkboxes */}
          <div className="space-y-3">
            <Label>Standard Inclusions</Label>
            {inclusionIsLoading ? (
              <div className="p-4 flex items-center justify-center border border-border rounded-md bg-muted/20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Controller
                control={control}
                name="inclusions"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-3 border border-border p-4 rounded-md bg-muted/20">
                    {inclusions?.map((inclusion: InclusionData) => (
                      <div
                        key={inclusion.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={inclusion.id}
                          disabled={isLoading}
                          checked={field.value?.some(
                            (val) => val.id === inclusion.id,
                          )}
                          onCheckedChange={(checked) => {
                            const currentValues = field.value || [];
                            const newValues = checked
                              ? [...currentValues, inclusion]
                              : currentValues.filter(
                                  (val) => val.id !== inclusion.id,
                                );
                            field.onChange(newValues);
                          }}
                        />
                        <label
                          htmlFor={inclusion.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {inclusion.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              />
            )}
          </div>
        </form>

        <DialogFooter className="mt-6 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="service-form" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
