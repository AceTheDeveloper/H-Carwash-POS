import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit2, Trash2 } from "lucide-react";

interface InclusionCardProps {
  id?: string;
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export function InclusionCard({
  label,
  onEdit,
  onDelete,
  isLoading = false,
}: InclusionCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30 p-2 shadow-none">
      <CardContent className="px-0">
        <div className="flex items-center justify-between gap-4">
          {/* Label with icon */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="font-medium text-foreground truncate text-sm sm:text-base">
              {label}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEdit}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Edit inclusion"
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit {label}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete inclusion"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete {label}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default InclusionCard;
