import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface InclusionPayload {
  label: string;
}

export default function InclusionDialog({ isOpen, setIsOpen }: Props) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<InclusionPayload>({
    defaultValues: {
      label: "",
    },
  });

  async function onSubmit(data: InclusionPayload) {
    setIsLoading(true);

    try {
      await api.post("/api/inclusions", data);
      reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inclusions"] });
    } catch (error) {
      console.error("Failed to add inclusion:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleClose = (open: boolean) => {
    if (isLoading) return;
    setIsOpen(open);
    if (!open) {
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-lg shadow-lg p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold">
            Add Inclusion
          </DialogTitle>
        </DialogHeader>

        <form
          id="inclusion-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="label">Inclusion Label</Label>
            <Controller
              control={control}
              name="label"
              rules={{
                required: "Inclusion label is required",
                minLength: {
                  message: "The number of characters must be at least 2",
                  value: 2,
                },
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="label"
                  disabled={isLoading}
                  placeholder="e.g. Tireblack"
                  className="bg-background"
                />
              )}
            />
            {errors.label && (
              <p className="text-sm font-medium text-destructive">
                {errors.label.message}
              </p>
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
          <Button type="submit" form="inclusion-form" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Inclusion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
