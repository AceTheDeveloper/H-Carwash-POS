"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tag, Plus, Loader2 } from "lucide-react";
import { AddOnsPayload } from "@/types/AddOnsPayload";

// 1. Updated Interface to expect a Promise
interface Props {
  onSubmit: (payload: AddOnsPayload) => Promise<void>;
}

export default function AddOnsDialog({ onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !price) return;

    setIsLoading(true);

    try {
      const payload = {
        label: label.trim(),
        price: parseFloat(price),
      };

      await onSubmit(payload);

      setLabel("");
      setPrice("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating add-on:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* asChild is correctly placed here! */}
      <DialogTrigger>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs sm:text-sm border-dashed border-border hover:border-primary/50"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Add-On
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Tag className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Create Add-On
            </DialogTitle>
          </div>
          <DialogDescription>
            Add a new extra service option that customers can select at
            checkout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Label Input */}
          <div className="space-y-2">
            <Label
              htmlFor="addon-label"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Add-On Name
            </Label>
            <Input
              id="addon-label"
              placeholder="e.g. Engine Wash, Leather Wax"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <Label
              htmlFor="addon-price"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Price (₱)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                ₱
              </span>
              <Input
                id="addon-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-7"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !label || !price}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Add-On"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
