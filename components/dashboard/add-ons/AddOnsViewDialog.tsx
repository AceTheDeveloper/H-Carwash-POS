"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tag, Loader2, Trash2, Edit } from "lucide-react";

// Adjust this interface based on your actual data structure
export interface AddOnData {
  id: string;
  label: string;
  price: number;
}

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addOn: AddOnData | null;
  // Passing the stubs so you can plug in your API calls easily
  onModify: (
    id: string,
    updatedData: { label: string; price: number },
  ) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function AddOnsViewDialog({
  isOpen,
  setIsOpen,
  addOn,
  onModify,
  onRemove,
}: Props) {
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");

  const [isModifying, setIsModifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Sync the dialog state with the selected add-on when it opens
  useEffect(() => {
    if (addOn && isOpen) {
      setLabel(addOn.label);
      setPrice(addOn.price.toString());
    }
  }, [addOn, isOpen]);

  const handleModify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addOn || !label.trim() || !price) return;

    setIsModifying(true);
    try {
      await onModify(addOn.id, {
        label: label.trim(),
        price: parseFloat(price),
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error modifying add-on:", error);
    } finally {
      setIsModifying(false);
    }
  };

  const handleRemove = async () => {
    if (!addOn) return;

    setIsRemoving(true);
    try {
      await onRemove(addOn.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Error removing add-on:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const isBusy = isModifying || isRemoving;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isBusy && setIsOpen(open)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Tag className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold">
              Manage Add-On
            </DialogTitle>
          </div>
          <DialogDescription>
            Update the details of this add-on or remove it from your menu
            completely.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleModify} className="space-y-4 py-2">
          {/* Label Input */}
          <div className="space-y-2">
            <Label
              htmlFor="edit-addon-label"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Add-On Name
            </Label>
            <Input
              id="edit-addon-label"
              placeholder="e.g. Engine Wash, Leather Wax"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isBusy}
              required
            />
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <Label
              htmlFor="edit-addon-price"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Price (₱)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                ₱
              </span>
              <Input
                id="edit-addon-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-7"
                disabled={isBusy}
                required
              />
            </div>
          </div>

          {/* Footer with Remove (Left) and Cancel/Modify (Right) */}
          <DialogFooter className="pt-4 flex sm:justify-between items-center w-full sm:flex-row flex-col-reverse gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={isBusy}
              className="w-full sm:w-auto"
            >
              {isRemoving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove
            </Button>

            <div className="flex w-full sm:w-auto gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isBusy}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isBusy || !label || !price}
                className="w-full sm:w-auto"
              >
                {isModifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="mr-2 h-4 w-4" />
                )}
                Modify
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
