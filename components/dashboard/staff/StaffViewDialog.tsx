"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { StaffData } from "@/types/StaffData";

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  staff: StaffData | null;
  onModify: (id: string, data: { name: string }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function StaffViewDialog({
  isOpen,
  setIsOpen,
  staff,
  onModify,
  onRemove,
}: Props) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (staff) setName(staff.name);
  }, [staff]);

  if (!staff) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onModify(staff.id, { name });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update staff:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onRemove(staff.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to remove staff:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 py-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-error border-error/30 hover:bg-error/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Removing..." : "Remove"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
